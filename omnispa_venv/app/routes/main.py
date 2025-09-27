"""Routes definition for OmniSPA"""

from flask import Blueprint, render_template, send_from_directory, current_app, url_for, jsonify
from app.models import db, SpaImage, Spa
import os

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@main_bp.route('/index.html')
def index():
    """Show the index.html page"""
    return render_template('index.html')

@main_bp.route('/registration.html')
def registration():
    """Show the registration page"""
    return render_template('registration.html')

@main_bp.route('/book.html')
def book():
    """Show the booking page"""
    return render_template('book.html')

@main_bp.route('/edit.html')
def edit():
    """Show the edit page"""
    return render_template('edit.html')

@main_bp.route('/location.html')
def location():
    """Show the location page"""
    return render_template('location.html')

@main_bp.route('/about.html')
def about():
    """Show the about page"""
    return render_template('about.html')

@main_bp.route('/reviews.html')
def reviews():
    """Show the reviews page"""
    return render_template('reviews.html')

@main_bp.route('/success')
def success():
    """Show the success page"""
    return render_template('success.html')

@main_bp.route('/favicon.ico')
def favicon():
    """Show the favicon"""
    return send_from_directory(os.path.join(current_app.root_path, 'static'),
                              'img/favicon.png', mimetype='image/png')

@main_bp.route('/api/carousel-images')
def get_carousel_images():
    """Get images for the carousel - all images from all spas"""
    try:
        # Get all spa images with their spa information
        images = db.session.query(
            SpaImage, 
            Spa.name.label('spa_name'),
            Spa.id.label('spa_id')
        ).join(
            Spa, SpaImage.spa_id == Spa.id
        ).limit(5).all()
        
        result = []
        for image, spa_name, spa_id in images:
            result.append({
                'filepath': url_for('static', filename=image.filepath),
                'caption': image.caption,
                'spa_name': spa_name,
                'spa_id': spa_id
            })
        
        return jsonify({
            'images': result
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching carousel images: {str(e)}")
        return jsonify({'images': []})