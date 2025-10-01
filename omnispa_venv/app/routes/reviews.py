"""Handling OmniSPA reviews"""

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, current_app
from flask_login import current_user, login_required
from app.models import db, Review, ReviewImage, User,Owner, Spa, allowed_file
import os

reviews_bp = Blueprint('reviews', __name__)

@reviews_bp.route('/api/reviews', methods=['POST'])
@login_required
def create_review():
    """Allow logged-in user or owner to create a review"""
    # Get data and files
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form
        files = request.files.getlist('review_images')
    else:
        data = request.get_json()
        files = []

    # Validate required fields
    required = ['spa_id', 'rating', 'comment']
    if not all(field in data for field in required):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    rating = int(data['rating'])
    if rating < 1 or rating > 5:
        return jsonify({'success': False, 'message': 'Rating must be between 1-5'}), 400

    spa = Spa.query.get(data['spa_id'])
    if not spa:
        return jsonify({'success': False, 'message': 'Spa not found'}), 404

    # Determine if current_user is User or Owner
    user_obj = current_user._get_current_object()
    if isinstance(user_obj, User):
        review = Review(
            user_id=user_obj.id,
            spa_id=data['spa_id'],
            rating=rating,
            comment=data['comment']
        )
    elif isinstance(user_obj, Owner):
        review = Review(
            owner_id=user_obj.id,
            spa_id=data['spa_id'],
            rating=rating,
            comment=data['comment']
        )

    # Store review in DB
    from app import db
    db.session.add(review)
    db.session.flush()

    # Handle uploaded images
    if files:
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        for file in files:
            if file.filename != '' and allowed_file(file.filename):
                image = ReviewImage.create_from_upload(
                    file=file,
                    review_id=review.id,
                    upload_folder=upload_folder
                )
                if image:
                    db.session.add(image)

    db.session.commit()

    # Determine display name
    display_name = (
    current_user.username if isinstance(current_user._get_current_object(), (User, Owner))
    else "Unknown"
)
    # Build JSON response
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

    return jsonify({'success': True, 'review': review_data}), 201

@reviews_bp.route('/api/spas/<int:spa_id>/reviews')
def get_spa_reviews(spa_id):
    """Returns all reviews for a specific spa in JSON"""
    reviews = Review.query.filter_by(spa_id=spa_id).all()# selects reviews for the given spa
    # Build the JSON response
    return jsonify({
        'reviews': [{
            'id': review.id,
            'username': review.user.username if review.user else review.owner.username,
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
