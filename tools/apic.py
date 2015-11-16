import requests
import json

def login(apic_url, apic_user, apic_pass):
    '''
    Logs into the specified APIC with given credentials.
    Will log into Fab1 by default.
    
    Returns: Session Object, so we don't have to keep passing cookies.
    
    '''
    login_url = apic_url + "/api/aaaLogin.json"
    payload = {"aaaUser" : {"attributes" : {"name" : apic_user, "pwd" : apic_pass} } }
    s = requests.Session()
    s.post(login_url, data=json.dumps(payload), verify=False)
    return s
    
def main():
    pass
    # session = login(APIC_URL, APIC_USER, APIC_PASS)
    
if __name__ == "__main__":
    main()