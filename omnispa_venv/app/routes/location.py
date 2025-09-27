"""Spa Location"""

from flask import Blueprint, render_template
from app.models import Spa

location_bp = Blueprint('location', __name__)

@location_bp.route('/spa/<int:spa_id>/location')
def spa_location(spa_id):
    """Shows a spa’s location page"""
    spa = Spa.query.get_or_404(spa_id)
    return render_template('location.html', spa=spa)