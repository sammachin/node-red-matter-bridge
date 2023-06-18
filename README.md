# Phone Numbers

A wrapper around google-libphonenumber which is a JS port of the Google libphonenumber library widely used to validate and format phone numbers in various systems e.g. Android and more

The node takes 2 inputs a string which is the number to be validated and a country code, this country code is not the country that the number is from it is from the perspective of where the person calling the number is located, 

This library should only be used for formatting numbers for display or for converting input to an appropriate format for dialling, it should not be relied upon for any billing or security purposes.

The global phone number system is a complex mess of rules and exceptions, not everything fits into a nice neat definition and what one person considers a number type to be another may disagree.

This pacakge is currently using google-libphonenumber 3.2.19 which was updated in March 2021, the numbering system changes over time so it will need to be updated from time to time.
