import requests
import apic
import json
import collections

def extract_obj(raw):
    try:
        class_name = list(raw)[0]
        obj = raw[class_name]['attributes']
        obj['className'] = class_name
        obj['id'] = obj['dn']
    except IndexError:
        pass
    return obj
    
def build_data(session, dn):
    query = APIC_URL + '/api/mo/' + dn + ".json"
    resp = session.get(query)
    
    root = extract_obj(resp.json()['imdata'][0])
    stack = [root]
    
    while stack:
        # Need to get the children and add links
        parent = stack.pop()
        query = APIC_URL + '/api/mo/' + parent["dn"] + ".json?query-target=children"
        resp = session.get(query)
        children = resp.json()['imdata']  # list of dicts

        parent['size'] = len(children) + 1
        if children:
            parent['children'] = []
            for obj in children:
                child = extract_obj(obj)
                stack.append(child)
                parent['children'].append(child)
    return root

def write_data(session):    
    filename = 'tsi1-leaf1-uni'
    dn = 'uni'
    graph = build_data(session, dn)
    with open('../data/{}.json'.format(filename), 'w') as f:
        json.dump(graph, f)
     
     
     
def main():     
    session = apic.login(APIC_URL, APIC_USER, APIC_PASS)
    write_data(session)

if __name__ == "__main__":
    main()