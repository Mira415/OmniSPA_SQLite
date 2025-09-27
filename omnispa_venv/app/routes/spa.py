# Provides a list of spas with their basic info and profile image

from flask import Blueprint, render_template, request, jsonify, flash, redirect, url_for, abort, current_app
from flask_login import current_user, login_required
from app.models import db, Spa, OperatingHours, Service, SpaImage, Availability, allowed_file
from datetime import datetime, timedelta
import json
import re
import os
from sqlalchemy import func

spa_bp = Blueprint('spa', __name__)

@spa_bp.route('/api/spas')
def get_spas():
    """Fetches all spas from the database"""
    spas = Spa.query.all()
    return jsonify({
        'spas': [
            {
                'id': spa.id,
                'name': spa.name,
                'description': spa.description,
                'image': (
                    url_for('static', filename='uploads/' + primary.filename)
                    if (primary := next((img for img in spa.images if img.is_primary), None))# If the spa has a primary image, it uses that
                    else url_for('static', filename='img/default_spa.jpg')
                )
            }
            for spa in spas # Loop through each spa and build a dictionary with: id, name, description and image
        ]
    })