"""Seed script to populate initial demo user and realistic Indian sample events."""
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
                full_name="Aarav Sharma",
                hashed_password=hash_password("password123"),
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print(f"Created demo user: {demo_user.email}")
        else:
            demo_user.full_name = "Aarav Sharma"
            db.commit()
            print(f"Updated demo user name to Indian format: {demo_user.email}")

        # Delete old events to re-seed with Indian format
        db.query(Event).filter(Event.owner_id == demo_user.id).delete()
        db.commit()

        now = datetime.now()

        # 1. Indian Wedding (Aarav & Ananya's Royal Udaipur Vivaah)
        wedding = Event(
            owner_id=demo_user.id,
            title="Aarav & Ananya's Royal Udaipur Vivaah",
            event_type=EventType.wedding,
            event_date=now + timedelta(days=120),
            venue="The Oberoi Udaivilas, Lake Pichola, Udaipur, Rajasthan",
            guest_count=250,
            total_budget=1800000.0,  # ₹18,00,000
            description="A 3-day royal destination wedding with traditional Rajasthani Mehendi, high-energy Bollywood Sangeet, sacred Vedic Pheras under a floral Mandap, and a grand reception feast.",
        )
        db.add(wedding)
        db.commit()
        db.refresh(wedding)

        # Wedding Budget Items (INR ₹)
        wedding_budget = [
            BudgetItem(event_id=wedding.id, category="Venue & Lawns", name="Palace Courtyard & Lakeside Mandap Lawn", estimated_cost=550000.0, actual_cost=520000.0, paid=True, notes="Advance booking confirmed"),
            BudgetItem(event_id=wedding.id, category="Catering & Sweets", name="Royal Rajasthani & North Indian Buffet + Live Chaat & Kulfi", estimated_cost=650000.0, actual_cost=650000.0, paid=False, notes="Menu includes Dal Baati Churma & live Jalebi counter"),
            BudgetItem(event_id=wedding.id, category="Photography", name="Candid Photography, Cinematic Teaser & Drone", estimated_cost=180000.0, actual_cost=175000.0, paid=True, notes="3-day coverage (Mehendi, Sangeet & Wedding)"),
            BudgetItem(event_id=wedding.id, category="Decorations & Mandap", name="Marigold & Jasmine Floral Mandap, Fairy Light Canopy", estimated_cost=200000.0, actual_cost=190000.0, paid=False, notes="Yellow Haldi theme & Royal Red Mandap"),
            BudgetItem(event_id=wedding.id, category="Music & Dhol", name="Punjabi Live Dhol Troupe, Sangeet Sound & Bollywood DJ", estimated_cost=120000.0, actual_cost=120000.0, paid=False, notes="Custom Baraat entry mix"),
            BudgetItem(event_id=wedding.id, category="Bridal Attire & Mehendi", name="Bridal Mehendi Artist & Sabyasachi Lehengas Trial", estimated_cost=100000.0, actual_cost=95000.0, paid=True, notes="Organic Rajasthani henna for bride & 40 guests"),
        ]
        db.add_all(wedding_budget)

        # Wedding Timeline Milestones
        wedding_timeline = [
            TimelineItem(event_id=wedding.id, title="Auspicious Muhurat & Lagan Patrika", description="Astrologer confirms ceremony timings; print custom Indian invitation cards with Mithai boxes", due_date=now + timedelta(days=20), priority=Priority.high, is_completed=True, category="Rituals"),
            TimelineItem(event_id=wedding.id, title="Catering Tasting & Menu Finalization", description="Taste test Chaat counter, Dal Makhani, Paneer Tikka, and dessert varieties with Maharaj", due_date=now + timedelta(days=40), priority=Priority.high, is_completed=True, category="Catering"),
            TimelineItem(event_id=wedding.id, title="Sangeet Dance Choreography Rehearsals", description="Family flashmob and couple dance practice sessions for the big Bollywood night", due_date=now + timedelta(days=70), priority=Priority.medium, is_completed=False, category="Entertainment"),
            TimelineItem(event_id=wedding.id, title="Haldi Yellow Décor & Phoolon Ki Holi Setup", description="Yellow marigold decor, brass urlis, and fresh yellow flower petals for Haldi ceremony", due_date=now + timedelta(days=118), priority=Priority.high, is_completed=False, category="Decor"),
            TimelineItem(event_id=wedding.id, title="Baraat Arrival & Mandap Varmala Ceremony", description="Groom entrance on vintage carriage with Dhol beats followed by Jai Mala on the lake stage", due_date=now + timedelta(days=120), priority=Priority.high, is_completed=False, category="Execution"),
        ]
        db.add_all(wedding_timeline)

        # Wedding Vendors (India)
        wedding_vendors = [
            VendorItem(event_id=wedding.id, vendor_type="venue", vendor_name="The Oberoi Udaivilas", contact_email="reservations@oberoi-udaivilas.com", contact_phone="+91 98290 12345", quoted_price=520000.0, status=VendorStatus.confirmed, notes="Lakeside lawn & banquet secured"),
            VendorItem(event_id=wedding.id, vendor_type="catering", vendor_name="Maharaj Shambhu Royal Caterers", contact_email="info@royalmaharajcaterers.in", contact_phone="+91 98450 67890", quoted_price=650000.0, status=VendorStatus.confirmed, notes="Specializes in Marwari & Mughlai feasts"),
            VendorItem(event_id=wedding.id, vendor_type="photography", vendor_name="Stories by Joseph Radhik Studios", contact_email="contact@storieswedding.com", contact_phone="+91 99200 11223", quoted_price=175000.0, status=VendorStatus.confirmed, notes="Full 4K cinematic film package"),
            VendorItem(event_id=wedding.id, vendor_type="music", vendor_name="DJ Chetas Entertainment & Dhol Crew", contact_email="booking@djchetas.in", contact_phone="+91 98111 22334", quoted_price=120000.0, status=VendorStatus.contacted, notes="Contract under review for Baraat + Sangeet"),
            VendorItem(event_id=wedding.id, vendor_type="decoration", vendor_name="Genda Phool Decorators & Mandap", contact_email="orders@gendaphool.in", contact_phone="+91 97110 55443", quoted_price=190000.0, status=VendorStatus.pending, notes="Jasmine & marigold theme layout received"),
        ]
        db.add_all(wedding_vendors)

        # Sample Indian Context AI Chat
        wedding_chat = [
            ChatMessage(event_id=wedding.id, role=ChatRole.user, content="Namaste! What are the best ideas for a lakeside Haldi ceremony in Udaipur?"),
            ChatMessage(event_id=wedding.id, role=ChatRole.assistant, content="Namaste! For a lakeside Haldi ceremony in Udaipur, opt for an all-yellow dress code for guests. Set up low Rajasthani baithak seating with vibrant bandhani cushions and marigold flower hangings. Add a 'Phoolon ki Holi' (flower petal celebration) with brass urlis floating with yellow marigold and rose petals, and serve chilled Masala Chaas and Thandai to keep guests refreshed!"),
        ]
        db.add_all(wedding_chat)

        # 2. Indian Birthday (Rohan's 1st Birthday & Annaprashan)
        birthday = Event(
            owner_id=demo_user.id,
            title="Rohan's 1st Birthday & Annaprashan Ceremony",
            event_type=EventType.birthday,
            event_date=now + timedelta(days=25),
            venue="Grand Magrath Banquet Hall, MG Road, Bengaluru",
            guest_count=60,
            total_budget=85000.0,  # ₹85,000
            description="Traditional first rice ceremony (Annaprashan) in the morning followed by an evening jungle safari themed 1st birthday party with family and close friends.",
        )
        db.add(birthday)
        db.commit()
        db.refresh(birthday)

        birthday_budget = [
            BudgetItem(event_id=birthday.id, category="Venue", name="Banquet Hall Rental (AC)", estimated_cost=30000.0, actual_cost=30000.0, paid=True, notes="Central Bangalore location"),
            BudgetItem(event_id=birthday.id, category="Catering", name="South & North Indian Lunch Thali with Payasam & Cake", estimated_cost=32000.0, actual_cost=30000.0, paid=True, notes="60 plates confirmed"),
            BudgetItem(event_id=birthday.id, category="Decorations", name="Jungle Safari Balloon Garland & Photo Backdrop", estimated_cost=12000.0, actual_cost=11000.0, paid=True, notes="Custom cutouts of baby Rohan"),
            BudgetItem(event_id=birthday.id, category="Entertainment", name="Puppet Show, Magician & Return Gifts", estimated_cost=11000.0, actual_cost=11000.0, paid=False, notes="Customized storybook return gifts"),
        ]
        db.add_all(birthday_budget)

        # 3. Indian Community Event (Greenwood Society Grand Diwali Mela & Dandiya Night)
        community = Event(
            owner_id=demo_user.id,
            title="Greenwood Park Grand Diwali Mela & Dandiya Utsav",
            event_type=EventType.community,
            event_date=now + timedelta(days=45),
            venue="Greenwood Society Clubhouse & Amphitheatre, Whitefield, Bengaluru",
            guest_count=650,
            total_budget=350000.0,  # ₹3,50,000
            description="Grand annual community festival featuring 25 resident artisanal handicraft and food stalls, live Garba and Dandiya Raas with traditional singers, eco-friendly diya painting workshops, and laser light show.",
        )
        db.add(community)
        db.commit()
        db.refresh(community)

        community_budget = [
            BudgetItem(event_id=community.id, category="Stage & Shamiana", name="Outdoor Stage, Red Carpet & Shamiana Canopies", estimated_cost=95000.0, actual_cost=90000.0, paid=True),
            BudgetItem(event_id=community.id, category="Sound & Lighting", name="Line Array Sound System, Fairy Lights & Diya Decor", estimated_cost=80000.0, actual_cost=75000.0, paid=False),
            BudgetItem(event_id=community.id, category="Food & Refreshments", name="Community Sweets, Samosas, Jalebi & Masala Tea Stalls", estimated_cost=85000.0, actual_cost=85000.0, paid=True),
            BudgetItem(event_id=community.id, category="Prizes & Security", name="Dandiya Competition Trophies, Security & Cleaning Crew", estimated_cost=55000.0, actual_cost=52000.0, paid=False),
            BudgetItem(event_id=community.id, category="Pooja & Cultural", name="Lakshmi Pooja Samagri & Pandit Ji Dakshina", estimated_cost=35000.0, actual_cost=35000.0, paid=True),
        ]
        db.add_all(community_budget)

        db.commit()
        print("Successfully seeded Indian celebrations (Weddings, Birthdays, Community Utsavs) in INR (Rs.)!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
