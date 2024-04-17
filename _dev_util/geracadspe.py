import random

def select_activities(activities, min_percentage=30, max_percentage=70):
    count = len(activities)
    num_to_select = random.randint(int(count * min_percentage / 100), int(count * max_percentage / 100))
    return random.sample(activities, num_to_select)

# Mapeando as classes para suas atividades
classes_activities = {
    1: ["Aikido", "Boxe", "Capoeira", "Jiu-Jitsu", "Judo", "Karatê", "Krav Magá", "MMA", "Taekwondo"],
    2: ["Bodybuilding", "Calistenia", "CrossFit", "Musculação", "Powerlifting", "Treinamento Funcional"],
    3: ["Acupuntura desportiva", "Bandagem funcional", "Fisioterapia cardiovascular e respiratória", "Fisioterapia esportiva", "Fisioterapia geriátrica", "Fisioterapia neurológica", "Fisioterapia ortopédica", "Massagem Ayurvédica", "Massagem com Pedras Quentes", "Massagem de Tecido Profundo", "Massagem Desportiva", "Massagem Relaxante", "Massagem Sueca", "Massagem Tailandesa", "Osteopatia", "Quiropraxia", "Reabilitação esportiva", "Terapia manual"],
    4: ["Aquafitness", "Hidroginástica", "Hidroterapia", "Natação"],
    5: ["Aeróbica", "Dança", "Dança Contemporânea", "Patinagem Artística", "Pole Dance", "Zumba"],
    6: ["Qi Gong", "Reiki", "Shiatsu", "Yoga", "Yoga Terapêutico"],
    7: ["Alongamento", "Basquete", "Ciclismo Indoor (Spinning)", "Drenagem Linfática", "Personal Trainer", "Reflexologia"]
}

# Lista de academias e suas classes
academies = [
    ("Academia Power Gym", [2, 1]),
    ("Pilates Studio Bem Estar", [3]),
    ("Academia Shape Fitness", [4, 5]),
    ("Studio de Pilates Equilíbrio", [3]),
    ("Academia Body Fit", [1]),
    ("Pilates & Co.", [3]),
    ("Academia Vitalidade", [1, 6]),
    ("Pilates Studio Flex", [3]),
    ("Academia Fitness Center", [1, 2]),
    ("Pilates Total", [3])
]

for academy, classes in academies:
    selected_activities = []
    for class_number in classes:
        activities = classes_activities[class_number]
        selected_activities.extend(select_activities(activities))
        for activity in selected_activities:
          print(f"{academy},{activity}")
    # print(f"{academy}: {', '.join(selected_activities)}")
