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

    # Hourly sweep: release any fleet unit reserved on a quote whose
    # valid_until has passed without being signed - a reservation blocking
    # a sellable serial for up to a day past expiry is a real inventory cost.
    scheduler.add_job(
        sweep_expired_quote_reservations_job,
        CronTrigger(minute=0),
        id='fleet_reservation_expiry_sweep',
        name='Fleet Reservation Expiry Sweep',
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


async def sweep_expired_quote_reservations_job():
    """Release fleet units reserved on expired quotes."""
    try:
        from fleet_inventory import sweep_expired_quote_reservations
        result = await sweep_expired_quote_reservations(_db)
        if result.get("expired_quotes"):
            logger.info(f"Fleet reservation sweep: expired {result['expired_quotes']} quote(s), released {result['released_units']} unit(s)")
    except Exception as e:
        logger.error(f"Failed to sweep expired quote reservations: {e}")


def shutdown_scheduler():
    """Gracefully shutdown the scheduler"""
    global scheduler
    if scheduler:
        scheduler.shutdown(wait=False)
        logger.info("Background scheduler shutdown")
