"""Handles user authentication checks and manages their favorite spas"""

from flask import Blueprint, request, jsonify, abort
from flask_login import current_user, login_required
from app.models import Favorite, db, Spa

user_bp = Blueprint('user', __name__)

@user_bp.route('/api/user/check-auth')
def check_auth():
    """Check authentication, if user is owner or not"""
    if current_user.is_authenticated:# Checks if a user is logged in
        if hasattr(current_user, 'is_owner') and current_user.is_owner:# Checks if a user is an owner
            return jsonify({
                'authenticated': True,
                'username': current_user.username,
                'email': current_user.email,
                'is_owner': True,
                'user_type': 'owner'
            })
        return jsonify({# Otherwise they are regular user
            'authenticated': True,
            'user_id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'is_owner': False,
            'user_type': 'user'
        })
    return jsonify({'authenticated': False})

@user_bp.route('/api/favorites', methods=['POST'])
@login_required
def toggle_favorite():
    """Add or remove a favorite spa"""
    data = request.get_json()
    spa_id = data.get('spa_id')
    
    if not spa_id:# If spa_id is missing, it returns an error
        return jsonify({'success': False, 'message': 'Missing spa_id'}), 400
    
    spa = Spa.query.get(spa_id)# Checks if the spa exists.
    if not spa:
        return jsonify({'success': False, 'message': 'Spa not found'}), 404
    # Looks up if the current user already marked this spa as a favorite
    favorite = Favorite.query.filter_by(
        user_id=current_user.id,
        spa_id=spa_id
    ).first()
    
    if favorite:# If spa is already in favorites don't add it again, but remove the duplicate
        db.session.delete(favorite)
        action = 'removed'
    else:
        favorite = Favorite(# Otherwise, creates a new favorite record
            user_id=current_user.id,
            spa_id=spa_id
        )
        db.session.add(favorite)
        action = 'added'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'action': action
    })

@user_bp.route('/api/favorites/check')
@login_required
def check_favorite():
    """Check if a spa is a favorite"""
    spa_id = request.args.get('spa_id')# Gets the spa ID from the query parameters in the request URL
    if not spa_id:# If the frontend didn’t provide a spa_id, return an error response
        return jsonify({'success': False, 'message': 'Missing spa_id'}), 400
    
    favorite = Favorite.query.filter_by(# Looks in the Favorite table to see if a record exists
        user_id=current_user.id,
        spa_id=spa_id
    ).first()
    
    return jsonify({# Returns True if the spa is in the user’s favorites, returns the first match if it exists
        'success': True,
        'is_favorite': favorite is not None
    })

@user_bp.route('/api/users/<int:user_id>/favorites')
@login_required
def get_user_favorites(user_id):
    """Get all favorites for a user"""
    if current_user.id != user_id:# Prevents other users from accessing someone else’s favorites
        abort(403)
    # Queries the Favorite table for all records belonging to this user
    favorites = Favorite.query.filter_by(user_id=user_id).join(Spa).all()
    
    # Gets the spa info
    result = []
    for fav in favorites:
        # Loops through each favorite record and fetches the associated Spa object
        spa_obj = fav.spa
        primary_image = None
        for img in spa_obj.images:
            if getattr(img, "is_primary", False):# Finds the primary image if available, otherwise first image or a default image
                primary_image = img.filepath
                break

        result.append({# Builds a dictionary of spa info
            "spa_id": spa_obj.id,
            "spa_name": spa_obj.name,
            "spa_description": spa_obj.description,
            "spa_image": primary_image or (spa_obj.images[0].filepath if spa_obj.images else "img/default_spa.jpg")
        })

    return jsonify(result)