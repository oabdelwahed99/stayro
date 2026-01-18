#!/usr/bin/env python
"""
Wrapper script to run seed_data.py
This can be run directly: python scripts/run_seed.py
Or: docker-compose exec web python scripts/run_seed.py
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Now import and run the seed script
from scripts.seed_data import main

if __name__ == '__main__':
    main()
