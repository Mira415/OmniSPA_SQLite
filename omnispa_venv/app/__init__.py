from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_mail import Mail
import os

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
mail = Mail()

def create_app():
    """Application factory function"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'c5bfc6219dd9dd9e1351d32150af4223eede7904a8c8fbcbf9f5a49b43740c1e'
    
    # Configuration settings
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///spa_registration.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads')
    app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
    app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 16MB
    
    # EMAIL CONFIGURATION
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = 'omnispa2k25@gmail.com'
    app.config['MAIL_PASSWORD'] = 'covappfmsffxbsdr'
    app.config['MAIL_DEFAULT_SENDER'] = 'omnispa2k25@gmail.com'
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)

    # Initialize email
    mail.init_app(app)

    # User loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_key):# ueser_key is the ID stored in the session by Flask-Login
        from app.models import Owner, User# avoid circular imports
        if not user_key:
            return None

        if "-" in user_key:  # Checks if the key contains a - (e.g., "owner-7")
            user_type, user_id = user_key.split("-", 1)# Splits into two parts: "owner" or "user" and the actual numeric ID
            if user_type == "owner":
                return Owner.query.get(int(user_id))# Depending on the type, it queries the right table (Owner or User)
            elif user_type == "user":
                return User.query.get(int(user_id))
        else:
            # For old sessions without prefixes, force logout to avoid conflicts
            return None

    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.spa import spa_bp
    from app.routes.user import user_bp
    from app.routes.booking import booking_bp
    from app.routes.reviews import reviews_bp
    from app.routes.main import main_bp
    from app.routes.search import search_bp
    from app.routes.register import register_bp
    from app.routes.profile import profile_bp
    from app.routes.location import location_bp
    from app.routes.edit import edit_bp
    from app.routes.quiz import quiz_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.email_route import email_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(spa_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(booking_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(main_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(register_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(location_bp)
    app.register_blueprint(edit_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(email_bp)

    @app.template_filter('is_admin_user')
    def is_admin_user_filter(user):
        if hasattr(user, 'is_admin') and callable(getattr(user, 'is_admin')):
            return user.is_admin()
        return False

    # Register template filters
    from app.utils.helpers import datetimeformat
    app.add_template_filter(datetimeformat, 'datetimeformat')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app