import requests
import csv
import time

# API endpoint
login_url = "http://149.28.154.143:5000/api/v1/login"  # Replace with your actual API endpoint
create_candidate_url = "http://149.28.154.143:5000/api/v1/candidate"  # Replace with your actual API endpoint

# Data to be sent in POST request (you can customize this as needed)
data_login = {
    "username": "user.test.01",
    "password": "pass1234",
}

data_candidate = {
    "cnd_name": "test altillery",
    "last_name": "11-10",
    "email": "asd@asd.com",
    "position": "asd",
    "gender": "male",
    "language": "indonesia",
    "organization": "asd",
    "start_login": "2024-10-11 00:00:00.000",
    "expire_login": "2024-10-31 00:00:00.000",
    "self_capture": "0",
    "proctoring": "0",
    "assessment_center": "0",
    "olinterview": "0",
    "id_battery": 12,
    "id_cnd_group": 0,
    "id_welcome_page": 0,
    "id_biodata_template": 0,
    "education_degree": [],
    "education_university_name": [],
    "education_university_status": [],
    "education_major": [],
    "job_function_id": [],
    "job_level_id": [],
}

candidate_name = "test altillery"

# List to store responses
responses = []

# Sending POST requests 100 times
for i in range(50):
    response = requests.post(login_url, json=data_login)
    if response.status_code == 200:
        token = response.json()['data']['token']
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        data_candidate["cnd_name"] = f"{candidate_name} {i + 1}"
        response_candidate = requests.post(create_candidate_url, json=data_candidate, headers=headers)  # Send POST request with JSON data
        if response_candidate.status_code == 201:
            responses.append(response_candidate.json()['data'])
            print(f"{candidate_name} {i + 1}")
        else:
            print(f"Request candidate {i+1} failed with status code: {response_candidate.status_code}")
    else:
        print(f"Request login {i+1} failed with status code: {response.status_code}")

    time.sleep(2)

# Save responses to a CSV file
with open('responses.csv', mode='w', newline='') as csv_file:
    writer = csv.DictWriter(csv_file, fieldnames=['username', 'password'])

    writer.writeheader()  # Write header row
    for response in responses:
        writer.writerow({ "username": response["username"], "password": response["password"] })  # Write each response as a row in the CSV

print("Responses saved to 'responses.csv'")