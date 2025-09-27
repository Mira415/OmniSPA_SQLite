"""OmniSPA Quiz for Spa suggestions"""

from flask import Blueprint, jsonify, url_for, request
from app.models import Spa, Service

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/api/quiz-data')
def get_quiz():
    """Generate options for the quiz"""
    try:
        spas = Spa.query.all()
        # Initializes sets so values are unique (no duplicates)
        categories = set()
        price_ranges = set()
        durations = set()
        
        for spa in spas:# Loops through each spa’s services
            for service in spa.services:
                categories.add(service.category)
                if service.price < 50:
                    price_ranges.add('Budget (SCR0-50)')
                elif service.price < 100:
                    price_ranges.add('Moderate (SCR50-100)')
                elif service.price < 150:
                    price_ranges.add('Premium (SCR100-150)')
                else:
                    price_ranges.add('Luxury (SCR150+)')
                
                if service.duration <= 30:
                    durations.add('Quick (≤30 min)')
                elif service.duration <= 60:
                    durations.add('Standard (30-60 min)')
                elif service.duration <= 90:
                    durations.add('Extended (60-90 min)')
                else:
                    durations.add('Lengthy (90+ min)')
        # Converts sets to lists so they can be JSON-encoded
        categories = sorted(list(categories))# Sorts them alphabetically (makes frontend display consistent)
        price_ranges = sorted(list(price_ranges))
        durations = sorted(list(durations))
        
        return jsonify({
            'success': True,
            'categories': categories,
            'price_ranges': price_ranges,
            'durations': durations
        })
        
    except Exception:
        return jsonify({
            'success': False,
            'message': 'Error loading quiz data'
        }), 500

@quiz_bp.route('/api/spa-recommendations', methods=['POST'])
def get_spa_recommendations():
    """Find matching spas based on quiz answers"""
    try:
        data = request.get_json()
        
        query = Spa.query.join(Service)
        # fetch spas that have at least one service meeting all chosen criteria
        if data.get('category'):
            query = query.filter(Service.category == data['category'])
        
        if data.get('price_range'):
            if data['price_range'] == 'Budget (SCR0-50)':
                query = query.filter(Service.price < 50)
            elif data['price_range'] == 'Moderate (SCR50-100)':
                query = query.filter(Service.price.between(50, 100))
            elif data['price_range'] == 'Premium (SCR100-150)':
                query = query.filter(Service.price.between(100, 150))
            elif data['price_range'] == 'Luxury (SCR150+)':
                query = query.filter(Service.price >= 150)
        
        if data.get('duration'):
            if data['duration'] == 'Quick (≤30 min)':
                query = query.filter(Service.duration <= 30)
            elif data['duration'] == 'Standard (30-60 min)':
                query = query.filter(Service.duration.between(30, 60))
            elif data['duration'] == 'Extended (60-90 min)':
                query = query.filter(Service.duration.between(60, 90))
            elif data['duration'] == 'Lengthy (90+ min)':
                query = query.filter(Service.duration > 90)
        
        matching_spas = query.distinct().all()# Returns spas that match at least one service, avoids duplicates if multiple services fit 
        # Build recommendations
        recommendations = []
        for spa in matching_spas:
            matching_services = []
            for service in spa.services:# Loop through each spa’s services
                matches = True
                # Re-check criteria service by service, to filter out only the ones that match
                if data.get('category') and service.category != data['category']:
                    matches = False
                
                if data.get('price_range'):
                    if data['price_range'] == 'Budget (SCR0-50)' and service.price >= 50:
                        matches = False
                    elif data['price_range'] == 'Moderate (SCR50-100)' and not (50 <= service.price < 100):
                        matches = False
                    elif data['price_range'] == 'Premium (SCR100-150)' and not (100 <= service.price < 150):
                        matches = False
                    elif data['price_range'] == 'Luxury (SCR150+)' and service.price < 150:
                        matches = False
                
                if data.get('duration'):
                    if data['duration'] == 'Quick (≤30 min)' and service.duration > 30:
                        matches = False
                    elif data['duration'] == 'Standard (30-60 min)' and not (30 <= service.duration <= 60):
                        matches = False
                    elif data['duration'] == 'Extended (60-90 min)' and not (60 <= service.duration <= 90):
                        matches = False
                    elif data['duration'] == 'Lengthy (90+ min)' and service.duration <= 90:
                        matches = False
                
                if matches:# Add those services into matching_services
                    matching_services.append({
                        'name': service.name,
                        'description': service.description,
                        'price': service.price,
                        'duration': service.duration
                    })
            # If the spa has at least one matching service then build a recommendation entry
            if matching_services:
                primary_image = next((img for img in spa.images if img.is_primary), None)
                recommendations.append({
                    'spa_id': spa.id,
                    'spa_name': spa.name,
                    'description': spa.description,
                    'image': url_for('static', filename=primary_image.filepath) if primary_image else url_for('static', filename='img/default_spa.jpg'),
                    'services': matching_services
                })
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'total_matches': len(recommendations)
        })
        
    except Exception:
        return jsonify({
            'success': False,
            'message': 'Error getting recommendations'
        }), 500