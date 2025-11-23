

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

CARDIO_ACTIVITIES = [
    "Running",
    "Cycling",
    "Swimming",
    "Jump Rope",
    "HIIT",
    "Dancing",
    "Rowing",
    "Elliptical"
]

STRENGTH_ACTIVITIES = [
    "Weight Lifting",
    "Bodyweight Exercises",
    "Resistance Bands",
    "Kettlebell Training",
    "Calisthenics",
    "Pilates",
    "CrossFit",
    "Powerlifting"
]

FLEXIBILITY_ACTIVITIES = [
    "Yoga",
    "Stretching",
    "Pilates",
    "Tai Chi",
    "Mobility Work",
    "Foam Rolling",
    "Dynamic Warm-ups"
]

REST_ACTIVITIES = [
    "Active Recovery",
    "Light Walking",
    "Meditation",
    "Sleep",
    "Hydration"
]

def calculate_split(goal, weekly_minutes):
    if goal == "weight_loss":
        cardio = 40
        strength = 30
        flexibility = 20
        rest = 10
    elif goal == "muscle_gain":
        cardio = 25
        strength = 45
        flexibility = 20
        rest = 10
    elif goal == "endurance":
        cardio = 50
        strength = 25
        flexibility = 15
        rest = 10
    else:
        cardio = 30
        strength = 30
        flexibility = 25
        rest = 15
    
    if weekly_minutes < 150:
        rest = max(5, rest - 5)
        flexibility = max(10, flexibility - 5)
        extra = 10
        cardio += extra // 2
        strength += extra // 2
    elif weekly_minutes > 400:
        rest = min(20, rest + 5)
        flexibility = min(30, flexibility + 5)
        cardio = max(20, cardio - 5)
        strength = max(20, strength - 5)
    
    total = cardio + strength + flexibility + rest
    if total != 100:
        diff = 100 - total
        if cardio >= strength and cardio >= flexibility and cardio >= rest:
            cardio += diff
        elif strength >= flexibility and strength >= rest:
            strength += diff
        elif flexibility >= rest:
            flexibility += diff
        else:
            rest += diff
    
    return {
        "cardio": cardio,
        "strength": strength,
        "flexibility": flexibility,
        "rest": rest
    }

def get_activities_for_type(activity_type, count=3):
    if activity_type == "cardio":
        activities = CARDIO_ACTIVITIES
    elif activity_type == "strength":
        activities = STRENGTH_ACTIVITIES
    elif activity_type == "flexibility":
        activities = FLEXIBILITY_ACTIVITIES
    else:
        activities = REST_ACTIVITIES
    
    return activities[:count]

def generate_explanation(goal, weekly_minutes, split):
    goal_names = {
        "weight_loss": "weight loss",
        "muscle_gain": "muscle gain",
        "endurance": "endurance",
        "general_fitness": "general fitness"
    }
    
    goal_text = goal_names.get(goal, "general fitness")
    
    explanation = f"Based on your goal of {goal_text} and {weekly_minutes} minutes per week, "
    explanation += f"we recommend {split['cardio']}% cardio, {split['strength']}% strength training, "
    explanation += f"{split['flexibility']}% flexibility work, and {split['rest']}% rest. "
    
    if goal == "weight_loss":
        explanation += "Cardio is prioritized to maximize calorie burn and support your weight loss goals."
    elif goal == "muscle_gain":
        explanation += "Strength training is emphasized to build muscle mass and increase strength."
    elif goal == "endurance":
        explanation += "Cardio is the focus to improve your cardiovascular endurance and stamina."
    else:
        explanation += "This balanced approach helps you build overall fitness across all areas."
    
    if weekly_minutes < 150:
        explanation += " With limited time, we've optimized for efficiency."
    elif weekly_minutes > 400:
        explanation += " With plenty of time available, we've included more rest and flexibility work for recovery."
    
    return explanation

@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        data = request.get_json()
        
        required_fields = ['age', 'height_cm', 'weight_kg', 'goal', 'weekly_minutes']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        age = int(data['age'])
        height_cm = float(data['height_cm'])
        weight_kg = float(data['weight_kg'])
        goal = data['goal']
        weekly_minutes = int(data['weekly_minutes'])
        
        if age < 13 or age > 100:
            return jsonify({'error': 'Age must be between 13 and 100'}), 400
        
        if height_cm < 100 or height_cm > 250:
            return jsonify({'error': 'Height must be between 100 and 250 cm'}), 400
        
        if weight_kg < 30 or weight_kg > 300:
            return jsonify({'error': 'Weight must be between 30 and 300 kg'}), 400
        
        valid_goals = ['weight_loss', 'muscle_gain', 'endurance', 'general_fitness']
        if goal not in valid_goals:
            return jsonify({'error': 'Invalid goal. Must be one of: ' + ', '.join(valid_goals)}), 400
        
        if weekly_minutes < 60 or weekly_minutes > 1000:
            return jsonify({'error': 'Weekly minutes must be between 60 and 1000'}), 400
        
        split = calculate_split(goal, weekly_minutes)
        
        activities = {
            "cardio": get_activities_for_type("cardio", 3),
            "strength": get_activities_for_type("strength", 3),
            "flexibility": get_activities_for_type("flexibility", 3),
            "rest": get_activities_for_type("rest", 2)
        }
        
        explanation = generate_explanation(goal, weekly_minutes, split)
        
        response = {
            "split": split,
            "activities": activities,
            "explanation": explanation
        }
        
        return jsonify(response), 200
        
    except ValueError as e:
        return jsonify({'error': 'Invalid number format: ' + str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Server error: ' + str(e)}), 500

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
