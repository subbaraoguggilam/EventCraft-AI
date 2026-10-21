"""Seed script to populate initial demo user and realistic sample events."""
from datetime import datetime, timedelta
from app.database import SessionLocal, Base, engine
from app.models.models import (
    User,
    Event,
    EventType,
    BudgetItem,
    TimelineItem,
    Priority,
    VendorItem,
    VendorStatus,
    ChatMessage,
    ChatRole,
)
from app.utils.security import hash_password

def seed_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if demo user already exists
        demo_user = db.query(User).filter(User.email == "demo@eventcraft.com").first()
        if not demo_user:
            demo_user = User(
                email="demo@eventcraft.com",
                full_name="Alex Morgan",
                hashed_password=hash_password("password123"),
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print(f"Created demo user: {demo_user.email}")
        else:
            print(f"Demo user already exists: {demo_user.email}")

        # Check if events already exist
        existing_events = db.query(Event).filter(Event.owner_id == demo_user.id).count()
        if existing_events == 0:
            now = datetime.utcnow()

            # 1. Wedding Event
            wedding = Event(
                owner_id=demo_user.id,
                title="Maya & Leo's Vineyard Wedding",
                event_type=EventType.wedding,
                event_date=now + timedelta(days=120),
                venue="Napa Valley Vista Vineyards",
                guest_count=120,
                total_budget=25000.0,
                description="Romantic rustic vineyard wedding with sunset outdoor ceremony, acoustic trio, wine tasting cocktail hour, and locally sourced 3-course dinner.",
            )
            db.add(wedding)
            db.commit()
            db.refresh(wedding)

            # Wedding Budget Items
            wedding_budget = [
                BudgetItem(event_id=wedding.id, category="Venue", name="Vineyard & Terrace Rental", estimated_cost=8000.0, actual_cost=7800.0, paid=True, notes="Paid 50% deposit"),
                BudgetItem(event_id=wedding.id, category="Catering", name="Farm-to-Table Plated Dinner (120 guests)", estimated_cost=8500.0, actual_cost=8500.0, paid=False, notes="Menu finalized with Chef"),
                BudgetItem(event_id=wedding.id, category="Photography", name="Full Day Photography + Drone", estimated_cost=3200.0, actual_cost=3000.0, paid=True, notes="Package includes high-res album"),
                BudgetItem(event_id=wedding.id, category="Entertainment", name="Live Acoustic String Trio & Reception DJ", estimated_cost=2400.0, actual_cost=2400.0, paid=False, notes="Custom song for first dance"),
                BudgetItem(event_id=wedding.id, category="Decorations", name="Floral Arches, Bouquets & Fairy Lights", estimated_cost=2200.0, actual_cost=2100.0, paid=False, notes="Eucalyptus and ivory roses"),
            ]
            db.add_all(wedding_budget)

            # Wedding Timeline Items
            wedding_timeline = [
                TimelineItem(event_id=wedding.id, title="Finalize Tasting Menu with Caterer", description="Sample 3 entrees and wine pairings with Chef", due_date=now + timedelta(days=20), priority=Priority.high, is_completed=True, category="Catering"),
                TimelineItem(event_id=wedding.id, title="Send Save-the-Dates & Digital RSVPs", description="Mail custom stationery and activate online RSVP page", due_date=now + timedelta(days=40), priority=Priority.high, is_completed=True, category="Stationery"),
                TimelineItem(event_id=wedding.id, title="Dress & Tuxedo First Fitting", description="Meet bridal tailor for custom alterations", due_date=now + timedelta(days=60), priority=Priority.medium, is_completed=False, category="Attire"),
                TimelineItem(event_id=wedding.id, title="Confirm Seating Chart & Place Cards", description="Organize table groups based on finalized RSVP headcounts", due_date=now + timedelta(days=90), priority=Priority.medium, is_completed=False, category="Logistics"),
                TimelineItem(event_id=wedding.id, title="Wedding Rehearsal & Welcome Dinner", description="Practice aisle walk with bridal party at vineyard", due_date=now + timedelta(days=119), priority=Priority.high, is_completed=False, category="Rehearsal"),
            ]
            db.add_all(wedding_timeline)

            # Wedding Vendors
            wedding_vendors = [
                VendorItem(event_id=wedding.id, vendor_type="venue", vendor_name="Vista Napa Vineyards", contact_email="events@vistavineyards.com", contact_phone="707-555-0142", quoted_price=7800.0, status=VendorStatus.confirmed, notes="Ceremony gazebo included"),
                VendorItem(event_id=wedding.id, vendor_type="catering", vendor_name="Harvest & Flame Culinary", contact_email="chef@harvestflame.com", contact_phone="415-555-0188", quoted_price=8500.0, status=VendorStatus.confirmed, notes="Includes champagne toast"),
                VendorItem(event_id=wedding.id, vendor_type="photography", vendor_name="Golden Hour Studios", contact_email="sam@goldenhour.photography", contact_phone="510-555-0199", quoted_price=3000.0, status=VendorStatus.confirmed, notes="Contract signed"),
                VendorItem(event_id=wedding.id, vendor_type="music", vendor_name="SoundWave DJ & Trio", contact_email="booking@soundwave.com", contact_phone="408-555-0133", quoted_price=2400.0, status=VendorStatus.contacted, notes="Awaiting revised contract"),
                VendorItem(event_id=wedding.id, vendor_type="decoration", vendor_name="Petals & Willow Botanicals", contact_email="orders@petalswillow.com", contact_phone="925-555-0177", quoted_price=2100.0, status=VendorStatus.pending, notes="Initial mood board sent"),
            ]
            db.add_all(wedding_vendors)

            # Sample AI Chat Message
            wedding_chat = [
                ChatMessage(event_id=wedding.id, role=ChatRole.user, content="Can you suggest outdoor lighting arrangements for an evening vineyard reception?"),
                ChatMessage(event_id=wedding.id, role=ChatRole.assistant, content="For an evening vineyard celebration, warm overhead bistro string lights zig-zagging between the arbor posts create an intimate canopy. Pair this with flickering hurricane lanterns along perimeter wine barrels and low amber uplighting illuminating the vineyard trellises for a magical golden hour transition!"),
            ]
            db.add_all(wedding_chat)

            # 2. Birthday Event
            birthday = Event(
                owner_id=demo_user.id,
                title="Liam's 10th Superhero Birthday Party",
                event_type=EventType.birthday,
                event_date=now + timedelta(days=25),
                venue="Skyline Adventure Park & Pavilion",
                guest_count=35,
                total_budget=1600.0,
                description="Action-packed comic book superhero themed birthday party with obstacle course games, custom costume photo booth, and themed cupcakes.",
            )
            db.add(birthday)
            db.commit()
            db.refresh(birthday)

            birthday_budget = [
                BudgetItem(event_id=birthday.id, category="Venue", name="Park Pavilion & Bounce Arena", estimated_cost=450.0, actual_cost=450.0, paid=True),
                BudgetItem(event_id=birthday.id, category="Catering", name="Pizza, Fruit Skewers & Superhero Cake", estimated_cost=500.0, actual_cost=480.0, paid=True),
                BudgetItem(event_id=birthday.id, category="Entertainment", name="Hero Entertainer & Face Painter (2 hrs)", estimated_cost=350.0, actual_cost=350.0, paid=False),
                BudgetItem(event_id=birthday.id, category="Decorations", name="Balloon Arch & Comic Backdrop", estimated_cost=200.0, actual_cost=180.0, paid=True),
            ]
            db.add_all(birthday_budget)

            # 3. Community Event
            community = Event(
                owner_id=demo_user.id,
                title="Riverside Spring Community Festival",
                event_type=EventType.community,
                event_date=now + timedelta(days=50),
                venue="Riverside Public Waterfront Park",
                guest_count=450,
                total_budget=9500.0,
                description="Annual town celebration featuring 15 artisanal food trucks, live acoustic local bands, children's craft workshops, and environmentally sustainable plant giveaways.",
            )
            db.add(community)
            db.commit()
            db.refresh(community)

            community_budget = [
                BudgetItem(event_id=community.id, category="Venue", name="City Special Event Permit & Sanitation", estimated_cost=2000.0, actual_cost=2000.0, paid=True),
                BudgetItem(event_id=community.id, category="Entertainment", name="Mobile Stage, PA System & Audio Tech", estimated_cost=3500.0, actual_cost=3200.0, paid=False),
                BudgetItem(event_id=community.id, category="Decorations", name="Eco Banners, Wayfinding Signage & Tents", estimated_cost=1800.0, actual_cost=1650.0, paid=True),
                BudgetItem(event_id=community.id, category="Other", name="Security & First Aid Station", estimated_cost=1500.0, actual_cost=1500.0, paid=False),
            ]
            db.add_all(community_budget)

            db.commit()
            print("Successfully populated demo events with budgets, timelines, vendors, and chat!")
        else:
            print("Events already seeded.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
