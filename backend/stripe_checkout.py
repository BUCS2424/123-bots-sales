"""
Stripe Checkout helper, built directly on the official `stripe` SDK.

Replaces the third-party `emergentintegrations.payments.stripe.checkout` wrapper
(which proxied requests through Emergent's own platform for its test keys).
Same class/method surface as that wrapper so call sites didn't need to change.
"""
import json
from typing import Dict, Any, Optional, List

import stripe
from pydantic import BaseModel, Field, validator


class CheckoutSessionRequest(BaseModel):
    amount: Optional[float] = Field(None, description="The amount to charge in the specified currency")
    currency: str = Field("usd", description="The currency code")
    stripe_price_id: Optional[str] = Field(None, description="The Stripe Price ID to use for the payment")
    quantity: int = Field(1, description="The quantity of items to purchase")
    success_url: Optional[str] = Field(None, description="URL to redirect to after successful payment")
    cancel_url: Optional[str] = Field(None, description="URL to redirect to if payment is cancelled")
    metadata: Optional[Dict[str, str]] = Field(None, description="Additional metadata to store with the session")
    payment_methods: Optional[List[str]] = Field(default_factory=lambda: ['card'])

    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError("Amount must be greater than 0")
        return v

    @validator('quantity')
    def validate_quantity(cls, v):
        if v < 1:
            raise ValueError("Quantity must be greater than 0")
        return v

    @validator('stripe_price_id')
    def validate_payment_method(cls, v, values):
        if v is None and values.get('amount') is None:
            raise ValueError("Either amount or stripe_price_id must be provided")
        if v is not None and values.get('amount') is not None:
            raise ValueError("Cannot provide both amount and stripe_price_id")
        return v

    @validator('payment_methods')
    def validate_payment_methods(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            v = [v]
        normalized = []
        for method in v:
            if method not in normalized:
                normalized.append(method)
        return normalized or None


class CheckoutSessionResponse(BaseModel):
    url: str = Field(..., description="The Stripe checkout session URL to redirect the customer to")
    session_id: str = Field(..., description="The ID of the created session")


class CheckoutStatusResponse(BaseModel):
    status: str = Field(..., description="The status of the checkout session")
    payment_status: str = Field(..., description="The payment status")
    amount_total: int = Field(..., description="The total amount in cents")
    currency: str = Field(..., description="The currency code")
    metadata: Dict[str, str] = Field(..., description="The metadata of the checkout session")


class WebhookEventResponse(BaseModel):
    event_type: str = Field(..., description="The type of webhook event")
    event_id: str = Field(..., description="The ID of the webhook event")
    session_id: Optional[str] = Field(None, description="The checkout session ID if applicable")
    payment_status: Optional[str] = Field(None, description="The payment status if applicable")
    metadata: Dict[str, str] = Field(..., description="The metadata of the event")


class CheckoutError(Exception):
    """Raised for errors in the Stripe checkout process."""
    pass


class StripeCheckout:
    """Creates payment sessions and processes Stripe checkout payments."""

    def __init__(self, api_key: str, webhook_secret: Optional[str] = None, webhook_url: Optional[str] = None):
        self.api_key = api_key
        self.webhook_secret = webhook_secret
        self.webhook_url = webhook_url
        stripe.api_key = self.api_key

    async def create_checkout_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        try:
            if request.amount is not None:
                amount_in_cents = int(request.amount * 100)
                line_items = [{
                    'price_data': {
                        'currency': request.currency,
                        'product_data': {'name': 'Payment'},
                        'unit_amount': amount_in_cents,
                    },
                    'quantity': 1,
                }]
            else:
                line_items = [{'price': request.stripe_price_id, 'quantity': request.quantity}]

            if self.webhook_url:
                request.metadata = {**(request.metadata or {}), 'webhook_url': self.webhook_url}

            payment_methods = request.payment_methods or ['card']

            session = stripe.checkout.Session.create(
                payment_method_types=payment_methods,
                line_items=line_items,
                mode='payment',
                success_url=request.success_url,
                cancel_url=request.cancel_url,
                metadata=request.metadata or {},
            )

            return CheckoutSessionResponse(url=session.url, session_id=session.id)

        except stripe.error.StripeError as e:
            raise CheckoutError(f"Failed to create checkout session: {str(e)}")
        except Exception as e:
            raise CheckoutError(f"Unexpected error creating checkout session: {str(e)}")

    async def get_checkout_status(self, checkout_session_id: str) -> CheckoutStatusResponse:
        try:
            session = stripe.checkout.Session.retrieve(checkout_session_id)
            return CheckoutStatusResponse(
                status=session.status,
                payment_status=session.payment_status,
                amount_total=session.amount_total,
                currency=session.currency,
                metadata=session.metadata,
            )
        except stripe.error.StripeError as e:
            raise CheckoutError(f"Failed to retrieve session status: {str(e)}")
        except Exception as e:
            raise CheckoutError(f"Unexpected error retrieving session status: {str(e)}")

    async def handle_webhook(self, payload: bytes, signature: Optional[str] = None) -> WebhookEventResponse:
        try:
            if self.webhook_secret:
                event = stripe.Webhook.construct_event(payload, signature, self.webhook_secret)
            else:
                event = json.loads(payload.decode('utf-8'))

            event_type = event['type']
            event_id = event['id']
            metadata = event.get('data', {}).get('object', {}).get('metadata', {})

            session_id = None
            payment_status = None

            if event_type in ('checkout.session.completed', 'checkout.session.expired'):
                session_data = event['data']['object']
                session_id = session_data.get('id')
                payment_status = session_data.get('payment_status')
            elif event_type == 'payment_intent.succeeded':
                payment_data = event['data']['object']
                session_id = payment_data.get('metadata', {}).get('checkout_session_id')
                payment_status = 'paid'
            elif event_type == 'payment_intent.payment_failed':
                payment_data = event['data']['object']
                session_id = payment_data.get('metadata', {}).get('checkout_session_id')
                payment_status = 'failed'

            return WebhookEventResponse(
                event_type=event_type,
                event_id=event_id,
                session_id=session_id,
                payment_status=payment_status,
                metadata=metadata,
            )

        except json.JSONDecodeError as e:
            raise CheckoutError(f"Invalid JSON payload: {str(e)}")
        except Exception as e:
            raise CheckoutError(f"Unexpected error processing webhook: {str(e)}")
