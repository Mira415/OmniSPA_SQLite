"""Viewing a spa’s profile page"""

from flask import Blueprint, render_template
from flask_login import current_user
from app.models import Spa

profile_bp = Blueprint('profile', __name__)

@profile_bp.route('/spa/<int:spa_id>', methods=['GET','POST'])
def spa_profile(spa_id):
    """View Spa profile"""
    spa = Spa.query.get_or_404(spa_id)# Fetches the spa by ID from the database
    show_edit_button = False
    # If logged in user is an owner, it will display edit button, otherwise, edit button is hidden
    if current_user.is_authenticated and hasattr(current_user, 'username'):
        owner = spa.owner
        show_edit_button = (current_user.username == owner.username and 
                           current_user.email == owner.email)
    
    return render_template('profile.html', 
                         spa=spa,
                         show_edit_button=show_edit_button)