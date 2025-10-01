"""Handling OmniSPA reviews"""

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, current_app
from flask_login import current_user, login_required
from app.models import db, Review, ReviewImage, User, Spa, allowed_file
import os

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/api/reviews', methods=['POST'])
@login_required
def create_review():
    """Allow logged-in user to create a review"""
    if request.content_type.startswith('multipart/form-data'):# Supports submitting a review with file uploads
        data = request.form
        files = request.files.getlist('review_images')
    else:
        data = request.get_json()# Supports submitting a review in request.get_json(), no images
        files = []
    
    required = ['spa_id', 'rating', 'comment']# Ensures the client sent all mandatory fields and returns a 400 Bad Request if any are missing
    if not all(field in data for field in required):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    if int(data['rating']) < 1 or int(data['rating']) > 5:# Ratings must be between 1 and 5
        return jsonify({'success': False, 'message': 'Rating must be between 1-5'}), 400
    
    spa = Spa.query.get(data['spa_id'])# Check if the spa exists
    if not spa:
        return jsonify({'success': False, 'message': 'Spa not found'}), 404
    
    # Check if current_user is an admin/owner or regular user
    if hasattr(current_user, 'is_admin') and current_user.is_admin():
        # This is an owner/admin - use a special display name
        display_name = "Admin"
    else:
        # This is a regular user
        display_name = current_user.username

    # Create Review object and save it
    review = Review(
        user_id=current_user.id,
        spa_id=data['spa_id'],
        rating=int(data['rating']),
        comment=data['comment']
    )
    
    db.session.add(review)
    db.session.flush()
    
    # Handle uploaded images (if any)
    if files:
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        for file in files:
            # Loops through uploaded images, validates file type, and creates ReviewImage objects linked to the review
            if file.filename != '' and allowed_file(file.filename):
                image = ReviewImage.create_from_upload(
                    file=file,
                    review_id=review.id,
                    upload_folder=upload_folder
                )
                if image:# Adds each image to the session for saving
                    db.session.add(image)
    
    db.session.commit()# Saves the review and all attached images to the database in one transaction.
    
    # Return JSON with review details (user, rating, comment, images)
    review_data = {
        'id': review.id,
        'username': display_name,
        'rating': review.rating,
        'comment': review.comment,
        'created_at': review.created_at.isoformat(),
        'images': [{
            'filepath': url_for('static', filename=img.filepath),
            'caption': img.caption
        } for img in review.images]
    }
    
    return jsonify({
        'success': True,
        'review': review_data
    }), 201

@reviews_bp.route('/api/spas/<int:spa_id>/reviews')
def get_spa_reviews(spa_id):
    """Returns all reviews for a specific spa in JSON"""
    reviews = Review.query.filter_by(spa_id=spa_id).join(User).all()# selects reviews for the given spa and joins the User table so that the reviewer's username is accessed
    # Build the JSON response
    return jsonify({
        'reviews': [{
            'id': review.id,
            'username': review.user.username,
            'rating': review.rating,
            'comment': review.comment,
            'created_at': review.created_at.isoformat(),
            'images': [{
                'filepath': url_for('static', filename=img.filepath),
                'caption': img.caption
            } for img in review.images]
        } for review in reviews]
    })

@reviews_bp.route('/spa/<int:spa_id>/submit-review', methods=['POST'])
@login_required
def submit_review(spa_id):
    """Submit and save review"""
    # Retrieves the values submitted in the form for rating and comment
    rating = request.form.get('rating')
    comment = request.form.get('comment')
    
    if not rating or not comment:# Checks if either rating or comment is empty
        flash('Please fill out all fields', 'error')
        return redirect(url_for('reviews.spa_reviews', spa_id=spa_id))
    # Create a review object
    review = Review(
        user_id=current_user.id,
        spa_id=spa_id,
        rating=int(rating),
        comment=comment
    )
    
    db.session.add(review)
    db.session.commit()
    
    flash('Review submitted successfully!', 'success')
    return redirect(url_for('reviews.spa_reviews', spa_id=spa_id))

@reviews_bp.route('/spa/<int:spa_id>/reviews')
def spa_reviews(spa_id):
    """Show reviews page for a Spa"""
    spa = Spa.query.get_or_404(spa_id)
    return render_template('reviews.html', spa=spa)
