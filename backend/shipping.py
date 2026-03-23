"""
Shipping Integration Module
Supports: Shippo, EasyPost, ShipStation
"""

import os
import uuid
import httpx
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shipping", tags=["shipping"])

# Database reference (set by server.py)
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ============== Pydantic Models ==============

class AddressModel(BaseModel):
    name: str
    company: Optional[str] = None
    street1: str
    street2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    country: str = "US"
    phone: Optional[str] = None
    email: Optional[str] = None


class ShippingRateRequest(BaseModel):
    from_address: AddressModel
    to_address: AddressModel
    weight_oz: float = Field(gt=0, description="Weight in ounces")
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None


class ShippingRate(BaseModel):
    provider: str  # shippo, easypost, shipstation
    carrier: str  # USPS, UPS, FedEx
    service: str  # Priority Mail, Ground, etc.
    rate: float  # Cost in dollars
    rate_with_upcharge: float  # Cost with store upcharge
    estimated_days: Optional[int] = None
    rate_id: str  # Provider's rate ID for purchasing


class CreateLabelRequest(BaseModel):
    order_id: str
    provider: str
    rate_id: str
    from_address: AddressModel
    to_address: AddressModel
    weight_oz: float
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None


class ShippingLabel(BaseModel):
    label_id: str
    order_id: str
    provider: str
    carrier: str
    service: str
    tracking_number: str
    label_url: str
    cost: float
    created_at: str


class TrackingInfo(BaseModel):
    tracking_number: str
    carrier: str
    status: str
    status_detail: Optional[str] = None
    estimated_delivery: Optional[str] = None
    events: List[Dict[str, Any]] = []


class ShippingSettingsUpdate(BaseModel):
    # Provider selection
    active_provider: Optional[str] = None  # shippo, easypost, shipstation, or None
    
    # Shippo
    shippo_api_key: Optional[str] = None
    shippo_enabled: bool = False
    
    # EasyPost
    easypost_api_key: Optional[str] = None
    easypost_enabled: bool = False
    
    # ShipStation
    shipstation_api_key: Optional[str] = None
    shipstation_api_secret: Optional[str] = None
    shipstation_enabled: bool = False
    
    # Stamps.com
    stamps_integration_id: Optional[str] = None
    stamps_username: Optional[str] = None
    stamps_password: Optional[str] = None
    stamps_enabled: bool = False
    
    # Upcharge settings
    global_upcharge_type: str = "none"  # none, flat, percentage
    global_upcharge_amount: float = 0.0
    
    # Free shipping
    free_shipping_enabled: bool = True
    free_shipping_threshold: float = 100.0  # Orders over this get free ground
    free_shipping_service: str = "USPS First Class"  # Service for free shipping
    
    # Default origin address
    origin_name: str = "123Bots"
    origin_street1: str = "7860 Eddins Road"
    origin_street2: Optional[str] = None
    origin_city: str = "Dothan"
    origin_state: str = "AL"
    origin_zip: str = "36301"
    origin_country: str = "US"
    origin_phone: Optional[str] = None


# ============== Shipping Provider Clients ==============

class ShippoClient:
    """Shippo API Client"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.goshippo.com"
        self.headers = {
            "Authorization": f"ShippoToken {api_key}",
            "Content-Type": "application/json"
        }
    
    async def test_connection(self) -> bool:
        """Test API connection"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/addresses/",
                    headers=self.headers
                )
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Shippo connection test failed: {e}")
            return False
    
    async def get_rates(self, request: ShippingRateRequest) -> List[Dict]:
        """Get shipping rates from Shippo"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Create shipment to get rates
                shipment_data = {
                    "address_from": {
                        "name": request.from_address.name,
                        "company": request.from_address.company,
                        "street1": request.from_address.street1,
                        "street2": request.from_address.street2,
                        "city": request.from_address.city,
                        "state": request.from_address.state,
                        "zip": request.from_address.zip_code,
                        "country": request.from_address.country,
                        "phone": request.from_address.phone,
                        "email": request.from_address.email
                    },
                    "address_to": {
                        "name": request.to_address.name,
                        "company": request.to_address.company,
                        "street1": request.to_address.street1,
                        "street2": request.to_address.street2,
                        "city": request.to_address.city,
                        "state": request.to_address.state,
                        "zip": request.to_address.zip_code,
                        "country": request.to_address.country,
                        "phone": request.to_address.phone,
                        "email": request.to_address.email
                    },
                    "parcels": [{
                        "length": str(request.length or 6),
                        "width": str(request.width or 4),
                        "height": str(request.height or 2),
                        "distance_unit": "in",
                        "weight": str(request.weight_oz),
                        "mass_unit": "oz"
                    }],
                    "async": False
                }
                
                response = await client.post(
                    f"{self.base_url}/shipments/",
                    headers=self.headers,
                    json=shipment_data
                )
                response.raise_for_status()
                data = response.json()
                
                rates = []
                for rate in data.get("rates", []):
                    rates.append({
                        "provider": "shippo",
                        "carrier": rate.get("provider", ""),
                        "service": rate.get("servicelevel", {}).get("name", ""),
                        "rate": float(rate.get("amount", 0)),
                        "estimated_days": rate.get("estimated_days"),
                        "rate_id": rate.get("object_id", ""),
                        "shipment_id": data.get("object_id", "")
                    })
                
                return rates
        except Exception as e:
            logger.error(f"Shippo get_rates error: {e}")
            raise
    
    async def create_label(self, rate_id: str) -> Dict:
        """Purchase a label using a rate ID"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/transactions/",
                    headers=self.headers,
                    json={
                        "rate": rate_id,
                        "label_file_type": "PDF",
                        "async": False
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "label_id": data.get("object_id"),
                    "tracking_number": data.get("tracking_number"),
                    "label_url": data.get("label_url"),
                    "cost": float(data.get("rate", {}).get("amount", 0)) if isinstance(data.get("rate"), dict) else 0
                }
        except Exception as e:
            logger.error(f"Shippo create_label error: {e}")
            raise
    
    async def get_tracking(self, carrier: str, tracking_number: str) -> Dict:
        """Get tracking info"""
        try:
            carrier_map = {"USPS": "usps", "UPS": "ups", "FedEx": "fedex"}
            carrier_code = carrier_map.get(carrier, carrier.lower())
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{self.base_url}/tracks/{carrier_code}/{tracking_number}/",
                    headers=self.headers
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "status": data.get("tracking_status", {}).get("status", "UNKNOWN"),
                    "status_detail": data.get("tracking_status", {}).get("status_details"),
                    "estimated_delivery": data.get("eta"),
                    "events": data.get("tracking_history", [])
                }
        except Exception as e:
            logger.error(f"Shippo get_tracking error: {e}")
            raise


class EasyPostClient:
    """EasyPost API Client"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.easypost.com/v2"
    
    async def test_connection(self) -> bool:
        """Test API connection"""
        try:
            async with httpx.AsyncClient(timeout=10.0, auth=(self.api_key, "")) as client:
                response = await client.get(f"{self.base_url}/users")
                return response.status_code in [200, 401]  # 401 means auth works but no access
        except Exception as e:
            logger.error(f"EasyPost connection test failed: {e}")
            return False
    
    async def get_rates(self, request: ShippingRateRequest) -> List[Dict]:
        """Get shipping rates from EasyPost"""
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=(self.api_key, "")) as client:
                # Create shipment
                shipment_data = {
                    "shipment": {
                        "from_address": {
                            "name": request.from_address.name,
                            "company": request.from_address.company,
                            "street1": request.from_address.street1,
                            "street2": request.from_address.street2,
                            "city": request.from_address.city,
                            "state": request.from_address.state,
                            "zip": request.from_address.zip_code,
                            "country": request.from_address.country,
                            "phone": request.from_address.phone,
                            "email": request.from_address.email
                        },
                        "to_address": {
                            "name": request.to_address.name,
                            "company": request.to_address.company,
                            "street1": request.to_address.street1,
                            "street2": request.to_address.street2,
                            "city": request.to_address.city,
                            "state": request.to_address.state,
                            "zip": request.to_address.zip_code,
                            "country": request.to_address.country,
                            "phone": request.to_address.phone,
                            "email": request.to_address.email
                        },
                        "parcel": {
                            "length": request.length or 6,
                            "width": request.width or 4,
                            "height": request.height or 2,
                            "weight": request.weight_oz
                        }
                    }
                }
                
                response = await client.post(
                    f"{self.base_url}/shipments",
                    json=shipment_data
                )
                response.raise_for_status()
                data = response.json()
                
                rates = []
                for rate in data.get("rates", []):
                    rates.append({
                        "provider": "easypost",
                        "carrier": rate.get("carrier", ""),
                        "service": rate.get("service", ""),
                        "rate": float(rate.get("rate", 0)),
                        "estimated_days": rate.get("delivery_days"),
                        "rate_id": rate.get("id", ""),
                        "shipment_id": data.get("id", "")
                    })
                
                return rates
        except Exception as e:
            logger.error(f"EasyPost get_rates error: {e}")
            raise
    
    async def create_label(self, shipment_id: str, rate_id: str) -> Dict:
        """Purchase a label"""
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=(self.api_key, "")) as client:
                response = await client.post(
                    f"{self.base_url}/shipments/{shipment_id}/buy",
                    json={"rate": {"id": rate_id}}
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "label_id": data.get("id"),
                    "tracking_number": data.get("tracking_code"),
                    "label_url": data.get("postage_label", {}).get("label_url"),
                    "cost": float(data.get("selected_rate", {}).get("rate", 0))
                }
        except Exception as e:
            logger.error(f"EasyPost create_label error: {e}")
            raise
    
    async def get_tracking(self, tracking_number: str) -> Dict:
        """Get tracking info"""
        try:
            async with httpx.AsyncClient(timeout=15.0, auth=(self.api_key, "")) as client:
                response = await client.get(
                    f"{self.base_url}/trackers",
                    params={"tracking_code": tracking_number}
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("trackers"):
                    tracker = data["trackers"][0]
                    return {
                        "status": tracker.get("status", "unknown"),
                        "status_detail": tracker.get("status_detail"),
                        "estimated_delivery": tracker.get("est_delivery_date"),
                        "events": tracker.get("tracking_details", [])
                    }
                return {"status": "unknown", "events": []}
        except Exception as e:
            logger.error(f"EasyPost get_tracking error: {e}")
            raise


class ShipStationClient:
    """ShipStation API Client"""
    
    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = "https://ssapi.shipstation.com"
    
    async def test_connection(self) -> bool:
        """Test API connection"""
        try:
            async with httpx.AsyncClient(timeout=10.0, auth=(self.api_key, self.api_secret)) as client:
                response = await client.get(f"{self.base_url}/carriers")
                return response.status_code == 200
        except Exception as e:
            logger.error(f"ShipStation connection test failed: {e}")
            return False
    
    async def get_carriers(self) -> List[Dict]:
        """Get available carriers"""
        try:
            async with httpx.AsyncClient(timeout=15.0, auth=(self.api_key, self.api_secret)) as client:
                response = await client.get(f"{self.base_url}/carriers")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"ShipStation get_carriers error: {e}")
            return []
    
    async def get_rates(self, request: ShippingRateRequest) -> List[Dict]:
        """Get shipping rates from ShipStation"""
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=(self.api_key, self.api_secret)) as client:
                # Get carriers first
                carriers = await self.get_carriers()
                
                rates = []
                for carrier in carriers:
                    carrier_code = carrier.get("code")
                    
                    rate_data = {
                        "carrierCode": carrier_code,
                        "fromPostalCode": request.from_address.zip_code,
                        "toState": request.to_address.state,
                        "toCountry": request.to_address.country,
                        "toPostalCode": request.to_address.zip_code,
                        "toCity": request.to_address.city,
                        "weight": {
                            "value": request.weight_oz,
                            "units": "ounces"
                        },
                        "dimensions": {
                            "length": request.length or 6,
                            "width": request.width or 4,
                            "height": request.height or 2,
                            "units": "inches"
                        }
                    }
                    
                    try:
                        response = await client.post(
                            f"{self.base_url}/shipments/getrates",
                            json=rate_data
                        )
                        if response.status_code == 200:
                            carrier_rates = response.json()
                            for rate in carrier_rates:
                                rates.append({
                                    "provider": "shipstation",
                                    "carrier": carrier.get("name", carrier_code),
                                    "service": rate.get("serviceName", ""),
                                    "rate": float(rate.get("shipmentCost", 0)) + float(rate.get("otherCost", 0)),
                                    "estimated_days": None,
                                    "rate_id": f"{carrier_code}:{rate.get('serviceCode')}",
                                    "carrier_code": carrier_code,
                                    "service_code": rate.get("serviceCode")
                                })
                    except Exception:
                        continue
                
                return rates
        except Exception as e:
            logger.error(f"ShipStation get_rates error: {e}")
            raise
    
    async def create_label(self, order_data: Dict, carrier_code: str, service_code: str) -> Dict:
        """Create a shipping label"""
        try:
            async with httpx.AsyncClient(timeout=30.0, auth=(self.api_key, self.api_secret)) as client:
                label_data = {
                    "carrierCode": carrier_code,
                    "serviceCode": service_code,
                    "packageCode": "package",
                    "shipFrom": order_data.get("from_address"),
                    "shipTo": order_data.get("to_address"),
                    "weight": order_data.get("weight"),
                    "dimensions": order_data.get("dimensions"),
                    "testLabel": False
                }
                
                response = await client.post(
                    f"{self.base_url}/shipments/createlabel",
                    json=label_data
                )
                response.raise_for_status()
                data = response.json()
                
                return {
                    "label_id": data.get("shipmentId"),
                    "tracking_number": data.get("trackingNumber"),
                    "label_url": data.get("labelData"),  # Base64 encoded
                    "cost": float(data.get("shipmentCost", 0))
                }
        except Exception as e:
            logger.error(f"ShipStation create_label error: {e}")
            raise


class StampsClient:
    """Stamps.com API Client (SWSIM Web Services)"""
    
    def __init__(self, integration_id: str, username: str, password: str):
        self.integration_id = integration_id
        self.username = username
        self.password = password
        self.base_url = "https://swsim.stamps.com/swsim/swsimv135.asmx"
        self.auth_token = None
    
    async def _authenticate(self) -> str:
        """Authenticate and get token"""
        try:
            soap_body = f"""<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://stamps.com/SWSim/SwsimV135">
                <soap:Body>
                    <tns:AuthenticateUser>
                        <tns:Credentials>
                            <tns:IntegrationID>{self.integration_id}</tns:IntegrationID>
                            <tns:Username>{self.username}</tns:Username>
                            <tns:Password>{self.password}</tns:Password>
                        </tns:Credentials>
                    </tns:AuthenticateUser>
                </soap:Body>
            </soap:Envelope>"""
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    self.base_url,
                    content=soap_body,
                    headers={
                        "Content-Type": "text/xml; charset=utf-8",
                        "SOAPAction": "http://stamps.com/SWSim/SwsimV135/AuthenticateUser"
                    }
                )
                if response.status_code == 200 and "Authenticator" in response.text:
                    # Extract token from XML response
                    import re
                    match = re.search(r'<Authenticator>([^<]+)</Authenticator>', response.text)
                    if match:
                        self.auth_token = match.group(1)
                        return self.auth_token
            return None
        except Exception as e:
            logger.error(f"Stamps.com authentication failed: {e}")
            return None
    
    async def test_connection(self) -> bool:
        """Test API connection"""
        try:
            token = await self._authenticate()
            return token is not None
        except Exception as e:
            logger.error(f"Stamps.com connection test failed: {e}")
            return False
    
    async def get_rates(self, request: ShippingRateRequest) -> List[Dict]:
        """Get shipping rates from Stamps.com"""
        try:
            if not self.auth_token:
                await self._authenticate()
            
            if not self.auth_token:
                raise Exception("Failed to authenticate with Stamps.com")
            
            soap_body = f"""<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://stamps.com/SWSim/SwsimV135">
                <soap:Body>
                    <tns:GetRates>
                        <tns:Authenticator>{self.auth_token}</tns:Authenticator>
                        <tns:Rate>
                            <tns:FromZIPCode>{request.from_address.zip_code}</tns:FromZIPCode>
                            <tns:ToZIPCode>{request.to_address.zip_code}</tns:ToZIPCode>
                            <tns:ToCountry>US</tns:ToCountry>
                            <tns:WeightOz>{request.weight_oz}</tns:WeightOz>
                            <tns:PackageType>Package</tns:PackageType>
                            <tns:Length>{request.length or 6}</tns:Length>
                            <tns:Width>{request.width or 4}</tns:Width>
                            <tns:Height>{request.height or 2}</tns:Height>
                            <tns:ShipDate>{datetime.now().strftime('%Y-%m-%d')}</tns:ShipDate>
                        </tns:Rate>
                    </tns:GetRates>
                </soap:Body>
            </soap:Envelope>"""
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    content=soap_body,
                    headers={
                        "Content-Type": "text/xml; charset=utf-8",
                        "SOAPAction": "http://stamps.com/SWSim/SwsimV135/GetRates"
                    }
                )
                response.raise_for_status()
                
                # Parse XML response for rates
                import re
                rates = []
                rate_matches = re.findall(r'<Rate[^>]*>(.*?)</Rate>', response.text, re.DOTALL)
                
                for i, rate_xml in enumerate(rate_matches):
                    service_match = re.search(r'<ServiceType>([^<]+)</ServiceType>', rate_xml)
                    amount_match = re.search(r'<Amount>([^<]+)</Amount>', rate_xml)
                    days_match = re.search(r'<DeliverDays>([^<]+)</DeliverDays>', rate_xml)
                    
                    if service_match and amount_match:
                        rates.append({
                            "provider": "stamps",
                            "carrier": "USPS",
                            "service": service_match.group(1),
                            "rate": float(amount_match.group(1)),
                            "estimated_days": int(days_match.group(1)) if days_match else None,
                            "rate_id": f"stamps_{i}_{service_match.group(1).replace(' ', '_')}",
                        })
                
                return rates
        except Exception as e:
            logger.error(f"Stamps.com get_rates error: {e}")
            raise
    
    async def create_label(self, request: ShippingRateRequest, service_type: str) -> Dict:
        """Create a shipping label"""
        try:
            if not self.auth_token:
                await self._authenticate()
            
            if not self.auth_token:
                raise Exception("Failed to authenticate with Stamps.com")
            
            soap_body = f"""<?xml version="1.0" encoding="utf-8"?>
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="http://stamps.com/SWSim/SwsimV135">
                <soap:Body>
                    <tns:CreateIndicium>
                        <tns:Authenticator>{self.auth_token}</tns:Authenticator>
                        <tns:IntegratorTxID>{uuid.uuid4()}</tns:IntegratorTxID>
                        <tns:Rate>
                            <tns:FromZIPCode>{request.from_address.zip_code}</tns:FromZIPCode>
                            <tns:ToZIPCode>{request.to_address.zip_code}</tns:ToZIPCode>
                            <tns:ToCountry>US</tns:ToCountry>
                            <tns:WeightOz>{request.weight_oz}</tns:WeightOz>
                            <tns:PackageType>Package</tns:PackageType>
                            <tns:ServiceType>{service_type}</tns:ServiceType>
                            <tns:Length>{request.length or 6}</tns:Length>
                            <tns:Width>{request.width or 4}</tns:Width>
                            <tns:Height>{request.height or 2}</tns:Height>
                            <tns:ShipDate>{datetime.now().strftime('%Y-%m-%d')}</tns:ShipDate>
                        </tns:Rate>
                        <tns:From>
                            <tns:FullName>{request.from_address.name}</tns:FullName>
                            <tns:Address1>{request.from_address.street1}</tns:Address1>
                            <tns:City>{request.from_address.city}</tns:City>
                            <tns:State>{request.from_address.state}</tns:State>
                            <tns:ZIPCode>{request.from_address.zip_code}</tns:ZIPCode>
                        </tns:From>
                        <tns:To>
                            <tns:FullName>{request.to_address.name}</tns:FullName>
                            <tns:Address1>{request.to_address.street1}</tns:Address1>
                            <tns:City>{request.to_address.city}</tns:City>
                            <tns:State>{request.to_address.state}</tns:State>
                            <tns:ZIPCode>{request.to_address.zip_code}</tns:ZIPCode>
                        </tns:To>
                    </tns:CreateIndicium>
                </soap:Body>
            </soap:Envelope>"""
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self.base_url,
                    content=soap_body,
                    headers={
                        "Content-Type": "text/xml; charset=utf-8",
                        "SOAPAction": "http://stamps.com/SWSim/SwsimV135/CreateIndicium"
                    }
                )
                response.raise_for_status()
                
                import re
                tracking_match = re.search(r'<TrackingNumber>([^<]+)</TrackingNumber>', response.text)
                url_match = re.search(r'<URL>([^<]+)</URL>', response.text)
                cost_match = re.search(r'<Amount>([^<]+)</Amount>', response.text)
                stamp_id_match = re.search(r'<StampsTxID>([^<]+)</StampsTxID>', response.text)
                
                return {
                    "label_id": stamp_id_match.group(1) if stamp_id_match else str(uuid.uuid4()),
                    "tracking_number": tracking_match.group(1) if tracking_match else "",
                    "label_url": url_match.group(1) if url_match else "",
                    "cost": float(cost_match.group(1)) if cost_match else 0
                }
        except Exception as e:
            logger.error(f"Stamps.com create_label error: {e}")
            raise
    
    async def get_tracking(self, tracking_number: str) -> Dict:
        """Get tracking info - Stamps.com uses USPS tracking"""
        # Stamps.com labels use USPS tracking, can query via USPS or return basic info
        return {
            "status": "IN_TRANSIT",
            "status_detail": "Track via USPS.com",
            "tracking_number": tracking_number,
            "events": []
        }


# ============== Helper Functions ==============

async def get_shipping_settings() -> Dict:
    """Get shipping settings from database"""
    settings = await db.shipping_settings.find_one({"type": "shipping"})
    if not settings:
        # Return defaults
        return {
            "active_provider": None,
            "shippo_enabled": False,
            "easypost_enabled": False,
            "shipstation_enabled": False,
            "stamps_enabled": False,
            "global_upcharge_type": "none",
            "global_upcharge_amount": 0,
            "free_shipping_enabled": True,
            "free_shipping_threshold": 100.0,
            "free_shipping_service": "USPS First Class",
            "origin_name": "123Bots",
            "origin_street1": "7860 Eddins Road",
            "origin_city": "Dothan",
            "origin_state": "AL",
            "origin_zip": "36301",
            "origin_country": "US"
        }
    
    # Remove MongoDB _id
    settings.pop("_id", None)
    return settings


def apply_upcharge(rate: float, settings: Dict, product_upcharge: float = 0) -> float:
    """Apply upcharge to shipping rate"""
    upcharge = 0
    
    # Global upcharge
    if settings.get("global_upcharge_type") == "flat":
        upcharge += settings.get("global_upcharge_amount", 0)
    elif settings.get("global_upcharge_type") == "percentage":
        upcharge += rate * (settings.get("global_upcharge_amount", 0) / 100)
    
    # Product-specific upcharge
    upcharge += product_upcharge
    
    return round(rate + upcharge, 2)


# ============== API Endpoints ==============

@router.get("/settings")
async def get_settings():
    """Get shipping settings (admin)"""
    settings = await get_shipping_settings()
    
    # Mask API keys for security
    if settings.get("shippo_api_key"):
        settings["shippo_api_key"] = "••••••••" + settings["shippo_api_key"][-4:]
    if settings.get("easypost_api_key"):
        settings["easypost_api_key"] = "••••••••" + settings["easypost_api_key"][-4:]
    if settings.get("shipstation_api_key"):
        settings["shipstation_api_key"] = "••••••••" + settings["shipstation_api_key"][-4:]
    if settings.get("shipstation_api_secret"):
        settings["shipstation_api_secret"] = "••••••••" + settings["shipstation_api_secret"][-4:]
    
    return settings


@router.get("/settings/full")
async def get_full_settings():
    """Get full shipping settings including API keys (admin only)"""
    return await get_shipping_settings()


@router.put("/settings")
async def update_settings(settings: ShippingSettingsUpdate):
    """Update shipping settings (admin)"""
    update_data = settings.model_dump(exclude_none=True)
    update_data["type"] = "shipping"
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Don't overwrite existing keys if masked value sent
    if update_data.get("shippo_api_key", "").startswith("••••"):
        del update_data["shippo_api_key"]
    if update_data.get("easypost_api_key", "").startswith("••••"):
        del update_data["easypost_api_key"]
    if update_data.get("shipstation_api_key", "").startswith("••••"):
        del update_data["shipstation_api_key"]
    if update_data.get("shipstation_api_secret", "").startswith("••••"):
        del update_data["shipstation_api_secret"]
    
    await db.shipping_settings.update_one(
        {"type": "shipping"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}


@router.post("/test-connection/{provider}")
async def test_provider_connection(provider: str):
    """Test connection to a shipping provider"""
    settings = await get_shipping_settings()
    
    if provider == "shippo":
        api_key = settings.get("shippo_api_key")
        if not api_key:
            raise HTTPException(status_code=400, detail="Shippo API key not configured")
        client = ShippoClient(api_key)
        success = await client.test_connection()
        
    elif provider == "easypost":
        api_key = settings.get("easypost_api_key")
        if not api_key:
            raise HTTPException(status_code=400, detail="EasyPost API key not configured")
        client = EasyPostClient(api_key)
        success = await client.test_connection()
        
    elif provider == "shipstation":
        api_key = settings.get("shipstation_api_key")
        api_secret = settings.get("shipstation_api_secret")
        if not api_key or not api_secret:
            raise HTTPException(status_code=400, detail="ShipStation credentials not configured")
        client = ShipStationClient(api_key, api_secret)
        success = await client.test_connection()
    
    elif provider == "stamps":
        integration_id = settings.get("stamps_integration_id")
        username = settings.get("stamps_username")
        password = settings.get("stamps_password")
        if not integration_id or not username or not password:
            raise HTTPException(status_code=400, detail="Stamps.com credentials not configured")
        client = StampsClient(integration_id, username, password)
        success = await client.test_connection()
        
    else:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    return {"success": success, "provider": provider}


@router.post("/rates", response_model=List[ShippingRate])
async def get_shipping_rates(request: ShippingRateRequest, product_upcharge: float = 0):
    """Get shipping rates from active provider"""
    settings = await get_shipping_settings()
    active_provider = settings.get("active_provider")
    
    if not active_provider:
        raise HTTPException(status_code=400, detail="No shipping provider configured")
    
    rates = []
    
    try:
        if active_provider == "shippo" and settings.get("shippo_enabled"):
            client = ShippoClient(settings.get("shippo_api_key"))
            raw_rates = await client.get_rates(request)
            
        elif active_provider == "easypost" and settings.get("easypost_enabled"):
            client = EasyPostClient(settings.get("easypost_api_key"))
            raw_rates = await client.get_rates(request)
            
        elif active_provider == "shipstation" and settings.get("shipstation_enabled"):
            client = ShipStationClient(
                settings.get("shipstation_api_key"),
                settings.get("shipstation_api_secret")
            )
            raw_rates = await client.get_rates(request)
        
        elif active_provider == "stamps" and settings.get("stamps_enabled"):
            client = StampsClient(
                settings.get("stamps_integration_id"),
                settings.get("stamps_username"),
                settings.get("stamps_password")
            )
            raw_rates = await client.get_rates(request)
            
        else:
            raise HTTPException(status_code=400, detail="Active provider not properly configured")
        
        # Apply upcharges and format response
        for raw_rate in raw_rates:
            rate_with_upcharge = apply_upcharge(raw_rate["rate"], settings, product_upcharge)
            rates.append(ShippingRate(
                provider=raw_rate["provider"],
                carrier=raw_rate["carrier"],
                service=raw_rate["service"],
                rate=raw_rate["rate"],
                rate_with_upcharge=rate_with_upcharge,
                estimated_days=raw_rate.get("estimated_days"),
                rate_id=raw_rate["rate_id"]
            ))
        
        # Sort by price
        rates.sort(key=lambda x: x.rate_with_upcharge)
        
    except Exception as e:
        logger.error(f"Error getting shipping rates: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    return rates


class CheckoutRatesRequest(BaseModel):
    """Request model for checkout rates"""
    to_address: AddressModel
    weight_oz: float = 8.0  # Default weight
    order_subtotal: float = 0.0


@router.post("/rates/checkout")
async def get_checkout_rates(request: CheckoutRatesRequest):
    """Get shipping rates for checkout - queries ALL enabled providers and returns best rates"""
    settings = await get_shipping_settings()
    
    # Build from address from settings
    from_address = AddressModel(
        name=settings.get("origin_name", "123Bots"),
        street1=settings.get("origin_street1", "") or "7860 Eddins Road",
        city=settings.get("origin_city", "") or "Dothan",
        state=settings.get("origin_state", "") or "AL",
        zip_code=settings.get("origin_zip", "") or "36301",
        country=settings.get("origin_country", "US"),
        phone=settings.get("origin_phone")
    )
    
    rate_request = ShippingRateRequest(
        from_address=from_address,
        to_address=request.to_address,
        weight_oz=request.weight_oz
    )
    
    all_rates = []
    
    # Check for free shipping eligibility
    free_shipping_eligible = (
        settings.get("free_shipping_enabled", False) and 
        request.order_subtotal >= settings.get("free_shipping_threshold", 100)
    )
    
    if free_shipping_eligible:
        all_rates.append({
            "provider": "store",
            "carrier": "FREE",
            "service": "Free Ground Shipping",
            "rate": 0,
            "rate_with_upcharge": 0,
            "estimated_days": 5,
            "rate_id": "free_shipping",
            "is_free": True
        })
    
    # Query ALL enabled providers (not just active) to compare rates
    providers_queried = []
    
    # Query Shippo if enabled
    if settings.get("shippo_enabled") and settings.get("shippo_api_key"):
        try:
            client = ShippoClient(settings.get("shippo_api_key"))
            raw_rates = await client.get_rates(rate_request)
            for raw_rate in raw_rates:
                rate_with_upcharge = apply_upcharge(raw_rate["rate"], settings)
                all_rates.append({
                    "provider": "shippo",
                    "carrier": raw_rate["carrier"],
                    "service": raw_rate["service"],
                    "rate": raw_rate["rate"],
                    "rate_with_upcharge": rate_with_upcharge,
                    "estimated_days": raw_rate.get("estimated_days"),
                    "rate_id": raw_rate["rate_id"],
                    "shipment_id": raw_rate.get("shipment_id"),
                    "is_free": False
                })
            providers_queried.append("shippo")
        except Exception as e:
            logger.warning(f"Could not fetch Shippo rates: {e}")
    
    # Query EasyPost if enabled
    if settings.get("easypost_enabled") and settings.get("easypost_api_key"):
        try:
            client = EasyPostClient(settings.get("easypost_api_key"))
            raw_rates = await client.get_rates(rate_request)
            for raw_rate in raw_rates:
                rate_with_upcharge = apply_upcharge(raw_rate["rate"], settings)
                all_rates.append({
                    "provider": "easypost",
                    "carrier": raw_rate["carrier"],
                    "service": raw_rate["service"],
                    "rate": raw_rate["rate"],
                    "rate_with_upcharge": rate_with_upcharge,
                    "estimated_days": raw_rate.get("estimated_days"),
                    "rate_id": raw_rate["rate_id"],
                    "shipment_id": raw_rate.get("shipment_id"),
                    "is_free": False
                })
            providers_queried.append("easypost")
        except Exception as e:
            logger.warning(f"Could not fetch EasyPost rates: {e}")
    
    # Query ShipStation if enabled
    if settings.get("shipstation_enabled") and settings.get("shipstation_api_key") and settings.get("shipstation_api_secret"):
        try:
            client = ShipStationClient(
                settings.get("shipstation_api_key"),
                settings.get("shipstation_api_secret")
            )
            raw_rates = await client.get_rates(rate_request)
            for raw_rate in raw_rates:
                rate_with_upcharge = apply_upcharge(raw_rate["rate"], settings)
                all_rates.append({
                    "provider": "shipstation",
                    "carrier": raw_rate["carrier"],
                    "service": raw_rate["service"],
                    "rate": raw_rate["rate"],
                    "rate_with_upcharge": rate_with_upcharge,
                    "estimated_days": raw_rate.get("estimated_days"),
                    "rate_id": raw_rate["rate_id"],
                    "carrier_code": raw_rate.get("carrier_code"),
                    "service_code": raw_rate.get("service_code"),
                    "is_free": False
                })
            providers_queried.append("shipstation")
        except Exception as e:
            logger.warning(f"Could not fetch ShipStation rates: {e}")
    
    # If no providers were queried or no rates found, use fallback
    if len(providers_queried) == 0 or (len(all_rates) == 0 or (len(all_rates) == 1 and all_rates[0].get("is_free"))):
        if not free_shipping_eligible:
            all_rates.append({
                "provider": "fallback",
                "carrier": "Standard",
                "service": "Ground Shipping",
                "rate": 15.00,
                "rate_with_upcharge": apply_upcharge(15.00, settings),
                "estimated_days": 5,
                "rate_id": "fallback_ground",
                "is_free": False
            })
        all_rates.extend([
            {
                "provider": "fallback",
                "carrier": "USPS",
                "service": "Priority Mail (2-3 days)",
                "rate": 8.50,
                "rate_with_upcharge": apply_upcharge(8.50, settings),
                "estimated_days": 3,
                "rate_id": "fallback_priority",
                "is_free": False
            },
            {
                "provider": "fallback",
                "carrier": "USPS",
                "service": "Express (1-2 days)",
                "rate": 26.50,
                "rate_with_upcharge": apply_upcharge(26.50, settings),
                "estimated_days": 1,
                "rate_id": "fallback_express",
                "is_free": False
            }
        ])
    
    # Sort all rates by price (cheapest first) - free shipping always at top
    all_rates.sort(key=lambda x: (0 if x.get("is_free") else 1, x.get("rate_with_upcharge", x.get("rate", 999))))
    
    # Deduplicate similar services from different providers - keep cheapest
    # Group by carrier + approximate service type
    seen_services = {}
    deduplicated_rates = []
    
    for rate in all_rates:
        # Create a key based on carrier and service type
        carrier = rate.get("carrier", "").upper()
        service = rate.get("service", "").upper()
        
        # Normalize service names for comparison
        service_key = carrier
        if "EXPRESS" in service or "OVERNIGHT" in service or "NEXT DAY" in service:
            service_key += "_EXPRESS"
        elif "PRIORITY" in service:
            service_key += "_PRIORITY"
        elif "FIRST" in service:
            service_key += "_FIRST"
        elif "GROUND" in service or "PARCEL" in service:
            service_key += "_GROUND"
        else:
            service_key += f"_{service[:20]}"  # Use first 20 chars of service name
        
        # Free shipping is always included
        if rate.get("is_free"):
            deduplicated_rates.append(rate)
            continue
        
        # For same service type, keep the cheapest one
        if service_key not in seen_services:
            seen_services[service_key] = rate
            deduplicated_rates.append(rate)
        elif rate.get("rate_with_upcharge", rate.get("rate", 999)) < seen_services[service_key].get("rate_with_upcharge", seen_services[service_key].get("rate", 999)):
            # Replace with cheaper option
            deduplicated_rates = [r for r in deduplicated_rates if not (
                r.get("carrier", "").upper() == carrier and 
                service_key.endswith(r.get("service", "").upper()[:20])
            )]
            seen_services[service_key] = rate
            deduplicated_rates.append(rate)
    
    # Sort final list by price
    deduplicated_rates.sort(key=lambda x: (0 if x.get("is_free") else 1, x.get("rate_with_upcharge", x.get("rate", 999))))
    
    return {
        "rates": deduplicated_rates,
        "free_shipping_eligible": free_shipping_eligible,
        "free_shipping_threshold": settings.get("free_shipping_threshold", 100),
        "providers_queried": providers_queried
    }


@router.post("/labels")
async def create_shipping_label(request: CreateLabelRequest):
    """Create a shipping label"""
    settings = await get_shipping_settings()
    
    # Handle free/fallback shipping
    if request.rate_id in ["free_shipping", "fallback_ground", "fallback_priority", "fallback_express"]:
        # Create a manual label record (no actual label generated)
        label = {
            "id": str(uuid.uuid4()),
            "order_id": request.order_id,
            "provider": "manual",
            "carrier": "Manual",
            "service": request.rate_id,
            "tracking_number": f"MANUAL-{uuid.uuid4().hex[:8].upper()}",
            "label_url": None,
            "cost": 0,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.shipping_labels.insert_one(label)
        label.pop("_id", None)
        return label
    
    # Get real label from provider
    provider = request.provider
    
    try:
        if provider == "shippo":
            client = ShippoClient(settings.get("shippo_api_key"))
            label_data = await client.create_label(request.rate_id)
            
        elif provider == "easypost":
            client = EasyPostClient(settings.get("easypost_api_key"))
            # EasyPost needs shipment_id - stored in rate_id as shipment_id:rate_id
            parts = request.rate_id.split(":")
            shipment_id = parts[0] if len(parts) > 1 else request.rate_id
            label_data = await client.create_label(shipment_id, request.rate_id)
            
        elif provider == "shipstation":
            client = ShipStationClient(
                settings.get("shipstation_api_key"),
                settings.get("shipstation_api_secret")
            )
            # ShipStation needs carrier_code:service_code
            parts = request.rate_id.split(":")
            carrier_code = parts[0]
            service_code = parts[1] if len(parts) > 1 else ""
            
            order_data = {
                "from_address": request.from_address.model_dump(),
                "to_address": request.to_address.model_dump(),
                "weight": {"value": request.weight_oz, "units": "ounces"},
                "dimensions": {
                    "length": request.length or 6,
                    "width": request.width or 4,
                    "height": request.height or 2,
                    "units": "inches"
                }
            }
            label_data = await client.create_label(order_data, carrier_code, service_code)
            
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")
        
        # Store label in database
        label = {
            "id": label_data.get("label_id") or str(uuid.uuid4()),
            "order_id": request.order_id,
            "provider": provider,
            "carrier": request.provider,
            "tracking_number": label_data.get("tracking_number"),
            "label_url": label_data.get("label_url"),
            "cost": label_data.get("cost", 0),
            "status": "created",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.shipping_labels.insert_one(label)
        label.pop("_id", None)
        
        return label
        
    except Exception as e:
        logger.error(f"Error creating label: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/labels/{order_id}")
async def get_order_labels(order_id: str):
    """Get shipping labels for an order"""
    labels = await db.shipping_labels.find({"order_id": order_id}).to_list(100)
    for label in labels:
        label.pop("_id", None)
    return labels


@router.get("/tracking/{tracking_number}")
async def get_tracking_info(tracking_number: str, carrier: str = "USPS"):
    """Get tracking information for a shipment"""
    settings = await get_shipping_settings()
    active_provider = settings.get("active_provider")
    
    if not active_provider:
        return {
            "tracking_number": tracking_number,
            "status": "unknown",
            "message": "No shipping provider configured"
        }
    
    try:
        if active_provider == "shippo":
            client = ShippoClient(settings.get("shippo_api_key"))
            tracking = await client.get_tracking(carrier, tracking_number)
            
        elif active_provider == "easypost":
            client = EasyPostClient(settings.get("easypost_api_key"))
            tracking = await client.get_tracking(tracking_number)
            
        else:
            return {
                "tracking_number": tracking_number,
                "status": "unknown",
                "message": "Tracking not supported for this provider"
            }
        
        return {
            "tracking_number": tracking_number,
            "carrier": carrier,
            **tracking
        }
        
    except Exception as e:
        logger.error(f"Error getting tracking: {e}")
        return {
            "tracking_number": tracking_number,
            "status": "error",
            "message": str(e)
        }


@router.delete("/labels/{label_id}")
async def void_label(label_id: str):
    """Void a shipping label"""
    # Update label status in database
    result = await db.shipping_labels.update_one(
        {"id": label_id},
        {"$set": {"status": "voided", "voided_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Label not found")
    
    return {"message": "Label voided", "label_id": label_id}
