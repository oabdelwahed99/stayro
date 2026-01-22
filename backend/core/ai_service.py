"""
AI Service for property recommendations using LLM
"""
import os
import json
from typing import List, Dict, Any, Optional
from decouple import config
from django.db.models import Q, Avg, Count
from django.conf import settings
from apps.properties.models import Property, PropertyReview, PropertyWishlist
from apps.bookings.models import Booking

# Try to import OpenAI, but make it optional
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    OpenAI = None


class PropertyRecommendationService:
    """
    Service for generating AI-powered property recommendations
    """
    
    def __init__(self):
        self.client = None
        if OPENAI_AVAILABLE:
            api_key = config('OPENAI_API_KEY', default=None)
            if api_key:
                try:
                    # Initialize OpenAI client
                    # Note: OpenAI 1.12.0 may have issues with proxy env vars
                    # If initialization fails, we'll fall back to similarity-based recommendations
                    self.client = OpenAI(api_key=api_key)
                except (TypeError, ValueError, Exception) as e:
                    # If there's an initialization error (e.g., proxies parameter issue),
                    # log it and continue without AI - fallback algorithm will be used
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(
                        f"Failed to initialize OpenAI client: {e}. "
                        f"AI recommendations will use fallback similarity algorithm. "
                        f"This is not critical - the system will continue to work."
                    )
                    self.client = None
    
    def _is_available(self) -> bool:
        """Check if OpenAI is available and configured"""
        return self.client is not None
    
    def _build_user_profile(self, user) -> Dict[str, Any]:
        """
        Build user profile from booking history, wishlist, and reviews
        """
        profile = {
            'booking_history': [],
            'wishlist_properties': [],
            'review_preferences': [],
            'preferred_amenities': set(),
            'preferred_property_types': set(),
            'price_range': None,
            'preferred_locations': set(),
        }
        
        # Get booking history
        bookings = Booking.objects.filter(
            customer=user,
            status__in=['APPROVED', 'COMPLETED']
        ).select_related('rental_property')
        
        for booking in bookings:
            prop = booking.rental_property
            profile['booking_history'].append({
                'property_type': prop.property_type,
                'amenities': prop.amenities or [],
                'price_per_night': float(prop.price_per_night),
                'city': prop.city,
                'country': prop.country,
                'capacity': prop.capacity,
            })
            profile['preferred_amenities'].update(prop.amenities or [])
            profile['preferred_property_types'].add(prop.property_type)
            profile['preferred_locations'].add(f"{prop.city}, {prop.country}")
        
        # Get wishlist properties
        wishlist_items = PropertyWishlist.objects.filter(
            user=user
        ).select_related('property')
        
        for item in wishlist_items:
            prop = item.property
            if prop.status == 'APPROVED':
                profile['wishlist_properties'].append({
                    'property_type': prop.property_type,
                    'amenities': prop.amenities or [],
                    'price_per_night': float(prop.price_per_night),
                    'city': prop.city,
                    'country': prop.country,
                    'capacity': prop.capacity,
                })
                profile['preferred_amenities'].update(prop.amenities or [])
                profile['preferred_property_types'].add(prop.property_type)
                profile['preferred_locations'].add(f"{prop.city}, {prop.country}")
        
        # Get review preferences (properties user liked)
        reviews = PropertyReview.objects.filter(
            user=user,
            rating__gte=4
        ).select_related('property')
        
        for review in reviews:
            prop = review.property
            profile['review_preferences'].append({
                'property_type': prop.property_type,
                'amenities': prop.amenities or [],
                'rating': review.rating,
                'city': prop.city,
                'country': prop.country,
            })
        
        # Calculate price range
        prices = [b['price_per_night'] for b in profile['booking_history'] + profile['wishlist_properties']]
        if prices:
            profile['price_range'] = {
                'min': min(prices),
                'max': max(prices),
                'avg': sum(prices) / len(prices)
            }
        
        # Convert sets to lists for JSON serialization
        profile['preferred_amenities'] = list(profile['preferred_amenities'])
        profile['preferred_property_types'] = list(profile['preferred_property_types'])
        profile['preferred_locations'] = list(profile['preferred_locations'])
        
        return profile
    
    def _build_property_description(self, property: Property) -> str:
        """Build a text description of a property for LLM"""
        desc_parts = [
            f"Title: {property.title}",
            f"Type: {property.property_type}",
            f"Location: {property.city}, {property.country}",
            f"Description: {property.description[:200]}...",
            f"Capacity: {property.capacity} guests",
            f"Bedrooms: {property.bedrooms}, Bathrooms: {property.bathrooms}",
            f"Price: ${property.price_per_night}/night",
        ]
        
        if property.amenities:
            desc_parts.append(f"Amenities: {', '.join(property.amenities)}")
        
        # Add average rating if available
        avg_rating = property.reviews.filter(is_approved=True).aggregate(Avg('rating'))['rating__avg']
        if avg_rating:
            desc_parts.append(f"Rating: {avg_rating:.1f}/5")
        
        return "\n".join(desc_parts)
    
    def _get_llm_recommendations(
        self, 
        user_profile: Dict[str, Any], 
        candidate_properties: List[Property],
        limit: int = 10
    ) -> List[int]:
        """
        Use LLM to analyze and rank properties based on user profile
        Returns list of property IDs in order of relevance
        """
        if not self._is_available():
            # Fallback: return property IDs without LLM ranking
            return [p.id for p in candidate_properties[:limit]]
        
        try:
            # Prepare context for LLM
            profile_summary = {
                'preferred_property_types': user_profile.get('preferred_property_types', []),
                'preferred_amenities': user_profile.get('preferred_amenities', [])[:10],  # Limit to top 10
                'preferred_locations': user_profile.get('preferred_locations', []),
                'price_range': user_profile.get('price_range'),
                'booking_count': len(user_profile.get('booking_history', [])),
            }
            
            # Build property descriptions
            properties_text = []
            for prop in candidate_properties:
                prop_desc = self._build_property_description(prop)
                properties_text.append(f"ID: {prop.id}\n{prop_desc}\n")
            
            prompt = f"""You are a property recommendation assistant. Based on the user's preferences and booking history, recommend properties from the list below.

User Profile:
- Preferred Property Types: {', '.join(profile_summary['preferred_property_types']) or 'None'}
- Preferred Amenities: {', '.join(profile_summary['preferred_amenities']) or 'None'}
- Preferred Locations: {', '.join(profile_summary['preferred_locations']) or 'None'}
- Price Range: {profile_summary['price_range'] if profile_summary['price_range'] else 'Not specified'}

Properties to evaluate:
{chr(10).join(properties_text)}

Return ONLY a JSON array of property IDs in order of relevance (most relevant first), with maximum {limit} properties. Format: [id1, id2, id3, ...]"""

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful property recommendation assistant. Always return valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=200,
            )
            
            # Parse response
            content = response.choices[0].message.content.strip()
            # Remove markdown code blocks if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
                content = content.strip()
            
            property_ids = json.loads(content)
            
            # Validate and filter to ensure all IDs exist in candidates
            candidate_ids = {p.id for p in candidate_properties}
            valid_ids = [pid for pid in property_ids if pid in candidate_ids]
            
            # Fill with remaining properties if needed
            remaining = [p.id for p in candidate_properties if p.id not in valid_ids]
            valid_ids.extend(remaining[:limit - len(valid_ids)])
            
            return valid_ids[:limit]
            
        except Exception as e:
            # On error, fallback to similarity-based ranking
            print(f"LLM recommendation error: {str(e)}")
            return self._fallback_recommendations(user_profile, candidate_properties, limit)
    
    def _fallback_recommendations(
        self,
        user_profile: Dict[str, Any],
        candidate_properties: List[Property],
        limit: int = 10
    ) -> List[int]:
        """
        Fallback recommendation algorithm using similarity scoring
        """
        scored_properties = []
        
        preferred_types = set(user_profile.get('preferred_property_types', []))
        preferred_amenities = set(user_profile.get('preferred_amenities', []))
        price_range = user_profile.get('price_range')
        
        for prop in candidate_properties:
            score = 0
            
            # Type match
            if prop.property_type in preferred_types:
                score += 10
            
            # Amenity overlap
            prop_amenities = set(prop.amenities or [])
            amenity_overlap = len(prop_amenities & preferred_amenities)
            score += amenity_overlap * 2
            
            # Price proximity
            if price_range:
                avg_price = price_range.get('avg', 0)
                if avg_price > 0:
                    price_diff = abs(float(prop.price_per_night) - avg_price) / avg_price
                    if price_diff < 0.2:  # Within 20%
                        score += 5
                    elif price_diff < 0.5:  # Within 50%
                        score += 2
            
            scored_properties.append((prop.id, score))
        
        # Sort by score descending
        scored_properties.sort(key=lambda x: x[1], reverse=True)
        return [pid for pid, _ in scored_properties[:limit]]
    
    def get_personalized_recommendations(
        self,
        user,
        exclude_property_id: Optional[int] = None,
        limit: int = 10
    ) -> List[Property]:
        """
        Get personalized recommendations for a user based on:
        - Booking history
        - Wishlist items
        - Review preferences
        - Similar users' choices
        """
        # Build user profile
        user_profile = self._build_user_profile(user)
        
        # Get candidate properties (exclude user's own properties and specified property)
        candidate_query = Property.objects.filter(status='APPROVED')
        
        # Exclude user's own properties
        candidate_query = candidate_query.exclude(owner=user)
        
        # Exclude specific property if provided
        if exclude_property_id:
            candidate_query = candidate_query.exclude(id=exclude_property_id)
        
        # Get initial candidates (can apply basic filters here)
        if user_profile['preferred_property_types']:
            # Filter by preferred types, but also include some variety
            preferred_type_properties = candidate_query.filter(
                property_type__in=user_profile['preferred_property_types']
            )
            # Get all property type choices as a list
            all_types = [choice[0] for choice in Property.PROPERTY_TYPE_CHOICES]
            variety_properties = candidate_query.filter(property_type__in=all_types)
            # Combine and limit
            candidate_query = (preferred_type_properties | variety_properties).distinct()[:limit * 3]
        else:
            candidate_query = candidate_query[:limit * 3]
        
        # Get candidates list
        candidates = list(candidate_query)
        
        if not candidates:
            # Fallback: get any approved properties
            fallback_query = Property.objects.filter(status='APPROVED').exclude(owner=user)
            if exclude_property_id:
                fallback_query = fallback_query.exclude(id=exclude_property_id)
            candidates = list(fallback_query[:limit * 3])
        
        if not candidates:
            return []
        
        # Use LLM or fallback to rank properties
        try:
            ranked_ids = self._get_llm_recommendations(user_profile, candidates, limit)
        except Exception as e:
            # If ranking fails, just return candidates in order
            print(f"Warning: Recommendation ranking failed: {str(e)}")
            ranked_ids = [p.id for p in candidates[:limit]]
        
        # Fetch properties in ranked order
        property_dict = {p.id: p for p in candidates}
        ranked_properties = [property_dict[pid] for pid in ranked_ids if pid in property_dict]
        
        return ranked_properties
    
    def get_similar_properties(
        self,
        property: Property,
        limit: int = 6
    ) -> List[Property]:
        """
        Find properties similar to the given property based on:
        - Property type
        - Amenities
        - Location (city/country)
        - Price range
        - Capacity
        """
        # Build similarity query
        similar_query = Property.objects.filter(
            status='APPROVED'
        ).exclude(id=property.id)
        
        # Same property type gets highest priority
        same_type = similar_query.filter(property_type=property.property_type)
        
        # Same location
        same_location = similar_query.filter(
            city=property.city,
            country=property.country
        )
        
        # Similar price (within 30%)
        from decimal import Decimal
        price_variance = float(property.price_per_night) * 0.3
        price_variance_decimal = Decimal(str(price_variance))
        similar_price = similar_query.filter(
            price_per_night__gte=property.price_per_night - price_variance_decimal,
            price_per_night__lte=property.price_per_night + price_variance_decimal
        )
        
        # Combine: prioritize same type + location, then same type + similar price
        # Use Q objects for proper query combination
        from django.db.models import Q
        
        combined_query = (
            (same_type & same_location) |
            (same_type & similar_price) |
            same_type
        ).distinct()[:limit * 2]
        
        candidates = list(combined_query)
        
        # If not enough, add more variety
        if len(candidates) < limit:
            remaining = list(similar_query.exclude(id__in=[p.id for p in candidates]))[:limit - len(candidates)]
            candidates.extend(remaining)
        
        # Use simple similarity scoring
        scored = []
        for prop in candidates:
            score = 0
            if prop.property_type == property.property_type:
                score += 10
            if prop.city == property.city and prop.country == property.country:
                score += 5
            # Safe price comparison - convert Decimals to floats for division
            prop_price = float(prop.price_per_night)
            property_price = float(property.price_per_night)
            if property_price > 0 and abs(prop_price - property_price) / property_price < 0.3:
                score += 3
            
            # Amenity overlap
            prop_amenities = set(prop.amenities or [])
            property_amenities = set(property.amenities or [])
            overlap = len(prop_amenities & property_amenities)
            score += overlap
            
            scored.append((prop, score))
        
        # Sort and return
        scored.sort(key=lambda x: x[1], reverse=True)
        return [prop for prop, _ in scored[:limit]]


# Global instance
recommendation_service = PropertyRecommendationService()
