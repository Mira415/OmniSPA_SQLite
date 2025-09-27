# Defines an admin panel where only admins can manage owners and spas location

from flask import Blueprint, render_template, request, flash, redirect, url_for
from flask_login import login_required, current_user
from app import db
from app.models import Owner, Spa
from werkzeug.security import generate_password_hash
import re

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

def is_admin():
    """Checks if the current user has an attribute"""
    return hasattr(current_user, 'is_admin') and current_user.is_admin()

@admin_bp.before_request
@login_required
def require_admin():
    """Protect all routes"""
    if not is_admin():# If the user is not an admin then flash error & redirect to home.
        flash('Access denied. Admin privileges required.', 'danger')
        return redirect(url_for('main.index'))

@admin_bp.route('/')
def admin_dashboard():
    """Admin Dashboard
    Shows a dashboard with all owners and all spas"""
    owners = Owner.query.all()
    spas = Spa.query.all()
    return render_template('admin/dashboard.html', owners=owners, spas=spas)

@admin_bp.route('/create-owner', methods=['GET', 'POST'])
def create_owner():
    """Handles a form to create a new Owner"""
    if request.method == 'POST':
        username = request.form.get('username')
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')
        confirm_password = request.form.get('confirm_password')
        
        # Validation
        errors = []
        
        if not all([username, name, email, password, confirm_password]):
            errors.append('All fields are required except phone.')
        
        if password != confirm_password:
            errors.append('Passwords do not match.')
        
        if len(password) < 6:
            errors.append('Password must be at least 6 characters long.')
        
        if Owner.query.filter_by(username=username).first():
            errors.append('Username already exists.')
        
        if Owner.query.filter_by(email=email).first():
            errors.append('Email already exists.')
        
        if not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            errors.append('Invalid email format.')
        
        if errors:
            for error in errors:
                flash(error, 'danger')
            return render_template('admin/create_owner.html', form_data=request.form)
        
        try:
            owner = Owner( # Create new Owner object
                username=username,
                name=name,
                email=email,
                phone=phone,
                is_verified=True
            )
            owner.set_password(password)# Set password securely (set_password() method calls generate_password_hash)
            db.session.add(owner)# Save to database
            db.session.commit()
            
            flash(f'Owner "{username}" created successfully!', 'success')
            return redirect(url_for('admin.admin_dashboard'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error creating owner: {str(e)}', 'danger')
    
    return render_template('admin/create_owner.html')

@admin_bp.route('/update-spa-location', methods=['GET', 'POST'])
def update_spa_location():
    """Lets admin update the Google Maps embed URL for a Spa"""
    spas = Spa.query.all()
    
    if request.method == 'POST':
        # Validate spa_id and maps_embed_url
        spa_id = request.form.get('spa_id')
        maps_embed_url = request.form.get('maps_embed_url')
        
        if not spa_id or not maps_embed_url:
            flash('Both spa selection and maps URL are required.', 'danger')
            return render_template('admin/update_spa_location.html', spas=spas)
        
        spa = Spa.query.get(spa_id)#Ensure spa exists.
        if not spa:
            flash('Spa not found.', 'danger')
            return render_template('admin/update_spa_location.html', spas=spas)
        
        try:
            spa.maps_embed_url = maps_embed_url# Update maps_embed_url in DB
            db.session.commit()
            
            flash(f'Location updated for "{spa.name}" successfully!', 'success')
            return redirect(url_for('admin.admin_dashboard'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating spa location: {str(e)}', 'danger')
    
    return render_template('admin/update_spa_location.html', spas=spas)