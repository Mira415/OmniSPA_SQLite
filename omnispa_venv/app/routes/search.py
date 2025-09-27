"""Searching for spas and services in OmniSPA"""

from flask import Blueprint, request, jsonify, url_for
from app.models import Spa, Service  # Import your models
from app import db
from sqlalchemy import or_

search_bp = Blueprint('search', __name__)

@search_bp.route('/api/search/suggestions')
def search_suggestions():
    """Autocomplete and search suggestions"""
    query = request.args.get('q', '').strip()# retrieves the query string parameter q from the URL, e.g., /search_suggestions?q=spa
    
    # Prevents unnecessary database queries for very short input (less than 2 characters).
    if len(query) < 2:
        return jsonify([])
    
    # Checks for the query in spa name, area, and services
    results = Spa.query.filter(
        or_(
            Spa.name.ilike(f'%{query}%'),
            Spa.area.ilike(f'%{query}%'),
            Spa.description.ilike(f'%{query}%'),
            Spa.address.ilike(f'%{query}%')
        )
    ).limit(10).all()
    # Build the JSON suggestions
    suggestions = []
    for spa in results:# Loops through the matched spas and creates a dictionary for each
        suggestions.append({
            'id': spa.id,
            'name': spa.name,
            'area': spa.area,
            'address': spa.address,
            'type': 'spa'
        })
    
    return jsonify(suggestions)

@search_bp.route('/api/search')
def search():
    """Main search endpoint"""
    query = request.args.get('q', '').strip()
    search_type = request.args.get('type', '').strip()
    
    if len(query) < 2:
        return jsonify([])
    
    if search_type == 'service':
        # Search for services and return the associated spas
        services = Service.query.filter(
            Service.name.ilike(f'%{query}%')
        ).limit(20).all()
        
        # Get unique spas from the services
        spa_ids = set()
        spas_with_services = []
        for service in services:
            if service.spa_id not in spa_ids:
                spa_ids.add(service.spa_id)
                spas_with_services.append(service.spa)
        
        results = []
        for spa in spas_with_services:
            # Get service names for this spa
            service_names = [service.name for service in spa.services]

            primary_image = next((img for img in spa.images if img.is_primary), None)
            image_url = (
                url_for('static', filename='uploads/' + primary_image.filename)
                if primary_image
                else url_for('static', filename='img/default_spa.jpg')
            )

            results.append({
                'id': spa.id,
                'name': spa.name,
                'description': spa.description,
                'area': spa.area,
                'address': spa.address,
                'phone': spa.phone,
                'services': service_names,
                'has_images': len(spa.images) > 0,
                'image_url': image_url
            })
        
        return jsonify(results)
    else:
        # Regular spa search
        spas = Spa.query.filter(
            or_(
                Spa.name.ilike(f'%{query}%'),
                Spa.area.ilike(f'%{query}%'),
                Spa.description.ilike(f'%{query}%'),
                Spa.address.ilike(f'%{query}%')
            )
        ).limit(20).all()
        
        results = []
        for spa in spas:
            # Get service names for this spa
            service_names = [service.name for service in spa.services]
            
            primary_image = next((img for img in spa.images if img.is_primary), None)
            image_url = (
                url_for('static', filename='uploads/' + primary_image.filename)
                if primary_image
                else url_for('static', filename='img/default_spa.jpg')
            )

            results.append({
                'id': spa.id,
                'name': spa.name,
                'description': spa.description,
                'area': spa.area,
                'address': spa.address,
                'phone': spa.phone,
                'services': service_names,
                'has_images': len(spa.images) > 0,
                'image_url': image_url
            })
        
        return jsonify(results)

@search_bp.route('/api/search/services')
def search_services():
    """Search by services"""
    query = request.args.get('q', '').strip()# Again retrieves the query string parameter q from the URL
    
    if len(query) < 2:
        return jsonify([])
    
    # Find services where the service name matches the query
    services = Service.query.filter(
        Service.name.ilike(f'%{query}%')# Looks for matches in Service.name
    ).limit(10).all()
    
    # Group services by spa
    spa_results = {}
    for service in services:
        if service.spa_id not in spa_results:
            spa_results[service.spa_id] = {
                'spa': service.spa,
                'matching_services': []
            }
        spa_results[service.spa_id]['matching_services'].append(service.name)
    
    suggestions = []
    for spa_id, data in spa_results.items():# Returns a list of spas with only the matching services
        spa = data['spa']
        suggestions.append({
            'id': spa.id,
            'name': spa.name,
            'area': spa.area,
            'address': spa.address,
            'matching_services': data['matching_services'],
            'type': 'service'
        })
    
    return jsonify(suggestions)