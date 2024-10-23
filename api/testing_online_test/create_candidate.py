import requests
import csv
import time

# API endpoint
gateway_url_dev = "http://192.168.10.211:5000/api/v1"
gateway_url_prod = "https://gwsp5-1.asi-asiapacific.com/api/v1"

# Default data candidate
data_candidate = {
    "cnd_name": "artillery-ari-1023",
    "email": "test@gmail.com",
    "position": "IT",
    "gender": "Male",
    "language": "indonesia",
    "organization": "ASI",
    "start_login": "2024-10-11 00:00:00.000",
    "expire_login": "2024-10-31 00:00:00.000",
    "self_capture": "0",
    "proctoring": "0",
    "assessment_center": "0",
    "olinterview": "0",
    "id_battery": 1,
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

# List to store responses
candidate_list = []

# select environment
print("Environment list:")
print("1. Dev")
print("2. Prod")
env = input("Select environment (input in number): ")
while env != "1" and env != "2":
    print("You select undefined environment")
    print("Environment list:")
    print("1. Dev")
    print("2. Prod")
    env = input("Select environment (input in number): ")

if env == "1":
    gateway_url =gateway_url_dev
elif env == "2":
    gateway_url =gateway_url_prod

# Sending POST requests 100 times
response_login = requests.post(f"{gateway_url}/login", json={ "username": "demo.01", "password": "pass1234" })
if response_login.status_code == 200:
    print("You have logged in.")
    num_candidate = input("Please enter the number of candidate you want to created: ")
    for i in range(int(num_candidate)):
        token = response_login.json()['data']['token']
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        data_candidate["last_name"] = f"test-{i + 1}"
        response_candidate = requests.post(f"{gateway_url}/candidate", json=data_candidate, headers=headers)  # Send POST request with JSON data
        if response_candidate.status_code == 201:
            candidate_list.append(response_candidate.json()['data'])
            print(f"candidate {i+1} created")
        else:
            print(f"Request candidate {i+1} failed with status code: {response_candidate.status_code}")
        time.sleep(0.1)
else:
    print(f"Request login failed with status code: {response_login.status_code}")

# Save responses to a CSV file
with open('candidate_list.csv', mode='w', newline='') as csv_file:
    writer = csv.DictWriter(csv_file, fieldnames=['username', 'password'])

    writer.writeheader()  # Write header row
    for candidate in candidate_list:
        writer.writerow({ "username": candidate["username"], "password": candidate["password"] })  # Write each response as a row in the CSV

print("Responses saved to 'candidate_list.csv'")