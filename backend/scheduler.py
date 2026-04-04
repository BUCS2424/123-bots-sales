"""
Background scheduler for periodic tasks like weekly inventory reports.
Uses APScheduler for reliable task scheduling.
"""

import asyncio
import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

scheduler = None
_db = None

def init_scheduler(database):
    """Initialize the scheduler with database reference"""
    global scheduler, _db
    _db = database
    
    scheduler = AsyncIOScheduler()
    
    # Schedule weekly inventory report for Monday at 8 AM
    scheduler.add_job(
        send_weekly_inventory_report,
        CronTrigger(day_of_week='mon', hour=8, minute=0),
        id='weekly_inventory_report',
        name='Weekly Inventory Report',
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Background scheduler started with weekly inventory report scheduled for Monday 8 AM")


async def send_weekly_inventory_report():
    """Send the weekly inventory report email"""
    try:
        from inventory_management import send_weekly_inventory_report as send_report
        await send_report()
        logger.info("Weekly inventory report sent successfully")
    except Exception as e:
        logger.error(f"Failed to send weekly inventory report: {e}")


def shutdown_scheduler():
    """Gracefully shutdown the scheduler"""
    global scheduler
    if scheduler:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler shutdown")
