"""Handling User and Owner authentication: Registration, Log In, Log Out
- Blueprint: Groups routes related to authentication
- Request: Lets you read data sent from the frontend (like forms)
- Jsonify: Sends JSON format response
- Flask_login: Handles login and logout and checks who is logged in
- Owner, User, Favourites, db: Models from the database
- Re:  Regular expressions (used to check email format)"""

from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, current_user, login_required
from app.models import Owner, User, db, Favorite
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/owner-login', methods=['POST'])
def owner_login():
    """Logs in Owners"""

    data = request.get_json()
    # Find the owner by username
    owner = Owner.query.filter_by(username=data['username']).first()
    # Check password
    if owner and owner.check_password(data['password']):
        login_user(owner)
        return jsonify({'success': True})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@auth_bp.route('/api/user/register', methods=['POST'])
def user_register():
    """User registration"""

    data = request.get_json()# Read JSON data (username, email, password)
    required = ['username', 'email', 'password']
    
    if not all(field in data for field in required):# Check if all fields exist
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400

    username = data['username'].strip()
    email = data['email'].strip().lower()
    
    if User.query.filter(User.username == username).first():# Check if Username and email are unique
        return jsonify({'success': False, 'message': 'Username already exists'}), 400

    if User.query.filter(User.email.ilike(email)).first():
        return jsonify({'success': False, 'message': 'Email already exists'}), 400

    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):# Check if email format is valid
        return jsonify({'success': False, 'message': 'Invalid email format'}), 400

    if len(data['password']) < 8:# Check if Password is at least 8 characters
        return jsonify({'success': False, 'message': 'Password must be at least 8 characters'}), 400

    # Save the user and the hash password and automatically log in the user
    try:
        user = User(
            username=username,
            email=email
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        
        return jsonify({
            'success': True,
            'user_id': user.id,
            'username': user.username
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Server error during registration'
        }), 500

@auth_bp.route('/api/user/login', methods=['POST'])
def user_login():
    """Logs in Users and finds the Spas they liked"""

    data = request.get_json()
    
    if not data or ('username' not in data and 'email' not in data) or 'password' not in data:
        return jsonify({'success': False, 'message': 'Username/Email and password required'}), 400
    
    if 'username' in data:# Look up user by username/email.
        user = User.query.filter_by(username=data['username']).first()
    else:
        user = User.query.filter_by(email=data['email'].lower()).first()
    
    if not user:
        return jsonify({
            'success': False, 
            'message': 'User not found'
        })
    
    if not user.check_password(data['password']):
        return jsonify({
            'success': False, 
            'message': 'Invalid password'
        }), 401
    
    login_user(user, remember=True)
    
    favorites = Favorite.query.filter_by(user_id=user.id).all()
    
    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'username': user.username
        },
        'favorites': [f.spa_id for f in favorites]
    })

@auth_bp.route('/api/user/logout', methods=['POST'])
# @login_required
def user_logout():
    """Logs out the currently logged-in user."""

    logout_user()
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    })

@auth_bp.route('/api/check-auth-status', methods=['GET'])
def check_auth_status():
    """Check if user is authenticated and return user information"""
    if current_user.is_authenticated:
        # Check if it's an Owner or User
        if hasattr(current_user, 'is_owner'):  # Owner object
            return jsonify({
                'authenticated': True,
                'is_owner': True,
                'user_id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'user_type': 'owner'
            })
        else:  # User object
            return jsonify({
                'authenticated': True,
                'is_owner': False,
                'user_id': current_user.id,
                'username': current_user.username,
                'email': current_user.email,
                'user_type': 'user'
            })
    else:
        return jsonify({
            'authenticated': False,
            'is_owner': False,
            'user_id': None,
            'username': None,
            'email': None,
            'user_type': None
        })
# @auth_bp.route('/api/force-logout-old-sessions', methods=['POST'])
# def force_logout_old_sessions():
#     logout_user()
#     return jsonify({'success': True, 'message': 'Please log in again'})