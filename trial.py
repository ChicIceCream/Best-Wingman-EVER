def main():
    dictionary = {}
    dictionary["learning"] = "awesome"
    dictionary["coding"] = "fun"
    dictionary["learn"] = "gay" 
    # ... Fill with more data
    remove_keys_containing_string(dictionary, "learn")
    # print(dictionary)

"""
This Python function takes in a dict and a string and  
removes all keys containing that string from the dict
"""
def remove_keys_containing_string(dictionary, remove):
    new_dictionary = {}
    for key in dictionary:
        if remove not in key:
            new_dictionary[key] = dictionary[key]
    print(new_dictionary)

main()