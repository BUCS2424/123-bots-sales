"""
AI Product Generator Module
Uses OpenAI-compatible API to search and auto-fill product information
"""
import os
import json
import re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# Database connection for fetching AI keys
_db = None

def init_ai_db():
    global _db
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME", "peptides_db")
    if mongo_url and not _db:
        client = AsyncIOMotorClient(mongo_url)
        _db = client[db_name]
    return _db


async def get_ai_api_config():
    """Fetch AI API keys from admin settings, with fallback to environment variables"""
    db = init_ai_db()
    
    # Try to get from database first
    if db:
        settings = await db.admin_settings.find_one({"type": "ai_keys"})
        if settings:
            # Check providers in priority order: OpenAI -> Anthropic -> APIFree.ai
            for provider_id in ["openai", "anthropic", "apifree"]:
                provider_config = settings.get(provider_id, {})
                if provider_config.get("enabled") and provider_config.get("api_key"):
                    # Determine base URL based on provider
                    if provider_id == "openai":
                        base_url = "https://api.openai.com/v1"
                        model = "gpt-4o"
                    elif provider_id == "anthropic":
                        base_url = "https://api.anthropic.com/v1"
                        model = "claude-3-sonnet-20240229"
                    elif provider_id == "apifree":
                        base_url = "https://api.apifree.ai/v1"
                        model = "openai/gpt-4o"
                    
                    return {
                        "api_key": provider_config["api_key"],
                        "base_url": base_url,
                        "model": model,
                        "provider": provider_id
                    }
    
    # Fallback to environment variables
    api_key = os.environ.get("OPENAI_API_KEY")
    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
    
    if api_key:
        return {
            "api_key": api_key,
            "base_url": base_url,
            "model": "gpt-4o",
            "provider": "env"
        }
    
    return None

class ProductLookupRequest(BaseModel):
    query: str  # Product name, model number, or manufacturer
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None

class ProductLookupResponse(BaseModel):
    name: str
    description: str
    category: str
    condition_tips: str
    brand: str
    manufacturer: str
    model_number: Optional[str] = None
    upc: Optional[str] = None
    weight: Optional[str] = None
    dimensions: Optional[str] = None
    msrp: Optional[float] = None
    key_features: list[str] = []
    specifications: dict = {}
    seo_title: str
    seo_description: str
    seo_keywords: list[str] = []
    suggested_price_range: Optional[str] = None

def get_ai_product_router(require_admin):
    router = APIRouter(prefix="/api/ai")
    
    @router.post("/product-lookup", response_model=ProductLookupResponse)
    async def lookup_product(request: ProductLookupRequest, current_user = Depends(require_admin)):
        """
        Use AI to search the web and find product information
        """
        # Get AI config from admin settings or environment
        ai_config = await get_ai_api_config()
        
        if not ai_config:
            raise HTTPException(status_code=500, detail="AI service not configured. Please add an API key in Admin Settings > AI Keys")
        
        api_key = ai_config["api_key"]
        base_url = ai_config["base_url"]
        model = ai_config["model"]
        
        # Build the search query
        search_parts = [request.query]
        if request.manufacturer:
            search_parts.append(f"by {request.manufacturer}")
        if request.model_number:
            search_parts.append(f"model {request.model_number}")
        
        search_query = " ".join(search_parts)
        
        # Initialize OpenAI client with custom base URL
        client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url
        )
        
        system_message = """You are an expert product researcher for a peptides catalog e-commerce system. 
Your job is to find detailed product information and create compelling, SEO-optimized descriptions.

When given a product name, model number, or manufacturer, you should:
1. Search your knowledge for the most accurate product specifications
2. Generate detailed, engaging product descriptions optimized for SEO
3. Provide accurate weight, dimensions, and technical specifications
4. Suggest appropriate pricing based on typical used/peptides catalog values
5. Create SEO metadata (title, description, keywords)

Always respond with accurate, factual information. If you're unsure about specific details, indicate that.
Format your response as valid JSON matching the exact structure requested."""

        prompt = f"""Find detailed product information for: "{search_query}"

Please search for this product and provide comprehensive information in the following JSON format:

{{
    "name": "Full product name with brand",
    "description": "Detailed 3-4 paragraph SEO-optimized description highlighting key features, benefits, and condition notes for a peptides catalog listing. Make it engaging and professional.",
    "category": "Most appropriate category (Electronics, Jewelry & Watches, Musical Instruments, Tools, Sporting Goods, Cameras & Photography, Gaming, Home & Garden, Collectibles, Other)",
    "condition_tips": "Tips for assessing condition of this specific product type",
    "brand": "Brand name",
    "manufacturer": "Manufacturer name",
    "model_number": "Model number if known",
    "upc": "UPC/Barcode if known, or null",
    "weight": "Weight with units (e.g., '2.5 lbs' or '1.2 kg')",
    "dimensions": "Dimensions (e.g., '12 x 8 x 4 inches')",
    "msrp": "Original retail price as number only (e.g., 999.99), or null if unknown",
    "key_features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
    "specifications": {{"spec_name": "spec_value", "another_spec": "value"}},
    "seo_title": "SEO-optimized title under 60 characters",
    "seo_description": "SEO meta description under 160 characters, compelling and keyword-rich",
    "seo_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "suggested_price_range": "Suggested used/pawn price range (e.g., '$150-$250')"
}}

Important: Return ONLY valid JSON, no additional text or markdown formatting."""

        try:
            # Call the API with the configured model
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Extract the response text
            response_text = response.choices[0].message.content.strip()
            
            # Clean the response - remove any markdown formatting
            cleaned_response = response_text
            if cleaned_response.startswith("```"):
                # Remove markdown code blocks
                cleaned_response = re.sub(r'^```json?\s*', '', cleaned_response)
                cleaned_response = re.sub(r'\s*```$', '', cleaned_response)
            
            # Parse JSON response
            try:
                product_data = json.loads(cleaned_response)
            except json.JSONDecodeError as e:
                # Try to extract JSON from the response
                json_match = re.search(r'\{[\s\S]*\}', cleaned_response)
                if json_match:
                    product_data = json.loads(json_match.group())
                else:
                    raise HTTPException(
                        status_code=500, 
                        detail=f"Failed to parse AI response: {str(e)}"
                    )
            
            # Ensure all required fields exist with defaults
            return ProductLookupResponse(
                name=product_data.get("name", search_query),
                description=product_data.get("description", ""),
                category=product_data.get("category", "Other"),
                condition_tips=product_data.get("condition_tips", ""),
                brand=product_data.get("brand", ""),
                manufacturer=product_data.get("manufacturer", request.manufacturer or ""),
                model_number=product_data.get("model_number"),
                upc=product_data.get("upc"),
                weight=product_data.get("weight"),
                dimensions=product_data.get("dimensions"),
                msrp=product_data.get("msrp"),
                key_features=product_data.get("key_features", []),
                specifications=product_data.get("specifications", {}),
                seo_title=product_data.get("seo_title", search_query[:60]),
                seo_description=product_data.get("seo_description", "")[:160],
                seo_keywords=product_data.get("seo_keywords", []),
                suggested_price_range=product_data.get("suggested_price_range")
            )
            
        except Exception as e:
            error_msg = str(e)
            # Provide helpful error messages
            if "authentication" in error_msg.lower() or "api key" in error_msg.lower():
                raise HTTPException(status_code=500, detail="AI API key is invalid. Please check your configuration.")
            elif "rate limit" in error_msg.lower():
                raise HTTPException(status_code=429, detail="AI rate limit exceeded. Please try again later.")
            else:
                raise HTTPException(status_code=500, detail=f"AI lookup failed: {error_msg}")

    # ============ CATEGORY CUSTOM FIELDS GENERATOR ============
    
    class CategoryFieldsRequest(BaseModel):
        category_name: str
        description: Optional[str] = None

    class CustomFieldOption(BaseModel):
        label: str
        value: str

    class CustomField(BaseModel):
        name: str
        label: str
        field_type: str
        required: bool = False
        options: Optional[list[CustomFieldOption]] = None
        placeholder: Optional[str] = None
        default_value: Optional[str] = None
        help_text: Optional[str] = None

    class CategoryFieldsResponse(BaseModel):
        category_name: str
        custom_fields: list[CustomField]

    @router.post("/generate-category-fields", response_model=CategoryFieldsResponse)
    async def generate_category_fields(request: CategoryFieldsRequest, current_user = Depends(require_admin)):
        """
        Use AI to generate custom form fields appropriate for a product category
        """
        # Get AI config from admin settings or environment
        ai_config = await get_ai_api_config()
        
        if not ai_config:
            raise HTTPException(status_code=500, detail="AI service not configured. Please add an API key in Admin Settings > AI Keys")
        
        client = AsyncOpenAI(
            api_key=ai_config["api_key"],
            base_url=ai_config["base_url"]
        )
        model = ai_config["model"]
        
        system_message = """You are an expert in peptides catalog inventory management and e-commerce. 
Your job is to generate appropriate custom form fields for product categories.

For each category, think about:
1. What specific attributes customers want to know about these items
2. What details help identify and price items correctly
3. Industry-standard specifications for this type of item
4. What makes items in this category unique or valuable

Field types available:
- "text": Single line text input
- "number": Numeric input
- "select": Dropdown with predefined options
- "multi_select": Multiple selection dropdown
- "textarea": Multi-line text input

Always provide practical, real-world options for select fields based on common values in the industry."""

        prompt = f"""Generate custom form fields for the product category: "{request.category_name}"
{f'Category description: {request.description}' if request.description else ''}

Create 5-10 relevant custom fields that would be useful for listing products in this category at a peptides catalog.

Return ONLY valid JSON in this exact format:
{{
    "category_name": "{request.category_name}",
    "custom_fields": [
        {{
            "name": "field_name_snake_case",
            "label": "Display Label",
            "field_type": "select|text|number|textarea|multi_select",
            "required": true/false,
            "options": [
                {{"label": "Option Label", "value": "option_value"}},
                ...
            ],
            "placeholder": "Placeholder text",
            "help_text": "Help text explaining the field"
        }},
        ...
    ]
}}

Examples of good fields by category type:
- Ammunition: caliber, grain weight, round count, bullet type, brand
- Jewelry: metal type, karat, gemstone, weight, size
- Electronics: brand, model, storage capacity, screen size
- Firearms: caliber, barrel length, action type, finish
- Tools: brand, power source, size, voltage
- Musical Instruments: brand, model, size, material, strings/keys

Important: Return ONLY the JSON, no markdown or extra text."""

        try:
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Clean markdown formatting
            cleaned_response = response_text
            if cleaned_response.startswith("```"):
                cleaned_response = re.sub(r'^```json?\s*', '', cleaned_response)
                cleaned_response = re.sub(r'\s*```$', '', cleaned_response)
            
            try:
                fields_data = json.loads(cleaned_response)
            except json.JSONDecodeError:
                json_match = re.search(r'\{[\s\S]*\}', cleaned_response)
                if json_match:
                    fields_data = json.loads(json_match.group())
                else:
                    raise HTTPException(status_code=500, detail="Failed to parse AI response")
            
            # Add unique IDs to each field
            import uuid
            for field in fields_data.get("custom_fields", []):
                field["id"] = str(uuid.uuid4())
            
            return CategoryFieldsResponse(
                category_name=fields_data.get("category_name", request.category_name),
                custom_fields=fields_data.get("custom_fields", [])
            )
            
        except Exception as e:
            error_msg = str(e)
            if "authentication" in error_msg.lower() or "api key" in error_msg.lower():
                raise HTTPException(status_code=500, detail="AI API key is invalid.")
            elif "rate limit" in error_msg.lower():
                raise HTTPException(status_code=429, detail="AI rate limit exceeded. Try again later.")
            else:
                raise HTTPException(status_code=500, detail=f"AI generation failed: {error_msg}")
    
    return router
