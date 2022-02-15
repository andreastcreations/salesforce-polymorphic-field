/**
 * @author       : Andreas Tsimpanogiannis
 * @version      : 1.0
 * @since        : 10/Feb/2022
 * </br>
 * @description  : The class that encapsulates all the logic for the PolymorphicFieldHandler
 *               controller. It checks for invalid input, handles security risks and returns
 *               a List of SObjects after performing a valid query.        
**/
public with sharing class PolymorphicFieldHandlerInternal {
    
    /**
     * @author      : Andreas Tsimpanogiannis
     * @version     : 1.0
     * @since       : 10/Feb/2022
     * </br>
     * @description : The main method that performs the query. It requires some text to query for,
     *              the SObject API name and some additional parameters (fields to query, conditions
     *              and Ids to exclude).
     * </br>
     * @param       inputQuery {String} : The user input we are querying.
     * @param       objectApiName {String} : The SObject we want to query.
     * @param       jsonFieldsToSearchFor {String} : Details about the fields we are querying,
     * @return      {List<SObject>} : The List of SObjects returned by the query.
     * @throws      {PolymorphicFieldException} : The exception class that is used for the errors
     *              of this class.
    **/
    public List<SObject> getQueryResults(String inputQuery, String objectApiName, String jsonFieldsToSearchFor) {

        if (inputQuery == null || String.isBlank(inputQuery)) {
            throw new PolymorphicFieldException(
                'You need to define a valid search value!');
        }
        if (objectApiName == null || String.isBlank(objectApiName)) {
            throw new PolymorphicFieldException(
                'You need to define an SObject before querying anything!');
        }
        if (jsonFieldsToSearchFor == null || String.isBlank(jsonFieldsToSearchFor)) {
            throw new PolymorphicFieldException(
                'Invalid search parameters! The result object is not defined properly on the client side.');
        }

        Schema.SObjectType sObjectType = getSObjectType(objectApiName);
        
        FieldsToSearchFor expectedResults = (FieldsToSearchFor)JSON.deserializeStrict(jsonFieldsToSearchFor, FieldsToSearchFor.class);
        
        Schema.SObjectField optionLabelField = getSObjectField(expectedResults.optionLabelApiName, sObjectType);
        Schema.SObjectField optionCommentField = getSObjectField(expectedResults.optionCommentApiName, sObjectType);

        // SELECT Id, {optionLabelField}, {optionCommentField}
        String stringQuery = 'SELECT Id';
        if (optionLabelField != null) {
            stringQuery += ', ' + optionLabelField;
        }
        if (optionCommentField != null && optionCommentField != optionLabelField) {
            stringQuery += ', ' + optionCommentField;
        }

        // FROM {sObjectType}
        stringQuery += ' FROM ' + sObjectType;

        // TODO: Work on this a bit further.
        // WHERE {condition1} AND {condition2}...
        if (expectedResults.conditions != null && expectedResults.conditions.size() != 0) {
            stringQuery += ' WHERE ' + String.join(expectedResults.conditions, ' AND ');
        }

        // AND {optionLabelField} LIKE '%{inputQuery}%'
        if (optionLabelField != null) {
            stringQuery += ' AND ' + optionLabelField + ' LIKE \'%' + String.escapeSingleQuotes(inputQuery) + '%\'';
        }

        // AND Id NOT IN {excludedIds}
        if (expectedResults.excludeIds != null && expectedResults.excludeIds.size() != 0) {
            stringQuery += ' AND Id NOT IN (\'' + String.join(expectedResults.excludeIds, '\',\'') + '\')';
        }

        List<SObject> result = Database.query(stringQuery);

        return result;
    }

    /**
     * @author       : Andreas Tsimpanogiannis
     * @version      : 1.0
     * @since        : 10/Feb/2022
     * </br>
     * @description  : Private class that is used to deserialise the JSON input
     *               of the "getQueryResults" method.
    **/
    private class FieldsToSearchFor {
        public String optionLabelApiName;
        public String optionCommentApiName;
        public List<String> conditions;
        public List<String> excludeIds;
    }

    /**
     * @author      : Andreas Tsimpanogiannis
     * @version     : 1.0
     * @since       : 10/Feb/2022
     * </br>
     * @description : The method that checks if a SObject type exists using the Schema describe methods.
     *              If the object exists, it returns the SObjectType and throws an exception
     *              otherwise.
     * </br>
     * @param       objectApiName {String} : The API name of the SObject in a string format.
     * @return      {Schema.SObjectType} : The type of the SObject.
     * @throws      {PolymorphicFieldException} : The exception class that is used for the errors
     *              of this class.
    **/
    @TestVisible
    private Schema.SObjectType getSObjectType(String objectApiName) {
        if (objectApiName == null || String.isBlank(objectApiName)) {
            throw new PolymorphicFieldException(
                'You need to define an SObject before querying anything!');
        }

        Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectApiName);
        if (sObjectType == null) {
            throw new PolymorphicFieldException(
                'Invalid SObject API name! This SObject Type \'' + sObjectType + '\' does not exist!');
        } else {
            if (sObjectType.getDescribe().isSearchable()) {
                return sObjectType;
            } else {
                throw new PolymorphicFieldException(
                    'Insufficient Access Rights! The SObject \'' + sObjectType + '\' is not Searchable.');
            }
        }
    }

    /**
     * @author      : Andreas Tsimpanogiannis
     * @version     : 1.0
     * @since       : 10/Feb/2022
     * </br>
     * @description : The method that checks if a SObject field exists using the Schema describe methods.
     *              If the field exists, it returns the SObjectField and throws an exception
     *              otherwise. If the user provides null for a field name, it returns null.
     * </br>
     * @param       fieldApiName {String} : The API name of the SObject field in a string format.
     * @param       sObjectType {Schema.SObjectType} : The type of the SObject.
     * @return      {Schema.SObjectField} : The SObjectField or null.
     * @throws      {PolymorphicFieldException} : The exception class that is used for the errors
     *              of this class.
    **/
    @TestVisible
	private Schema.SObjectField getSObjectField(String fieldApiName, Schema.SObjectType sObjectType){
        if (sObjectType == null) {
            throw new PolymorphicFieldException(
                'You need to define an SObjectType!');
        }

        if (fieldApiName == null || String.isBlank(fieldApiName)) {
            return null;
        }
        if (fieldApiName.equalsIgnoreCase('Id')) {
            throw new PolymorphicFieldException(
                'The Id of an SObject is queried by default. You need to change your query.');
        }

        Schema.SObjectField sObjectField = sObjectType.getDescribe().fields.getMap().get(fieldApiName);
        if (sObjectField != null && !sObjectField.getDescribe().isAccessible()) {
            throw new PolymorphicFieldException(
                'Insufficient Access Rights! The field \'' + fieldApiName + '\' is not Accessible.');
        } else {
            return sObjectField;
        }
	}

    /**
     * @author       : Andreas Tsimpanogiannis
     * @version      : 1.0
     * @since        : 10/Feb/2022
     * </br>
     * @description  : Private exception that is used for the errors
     *               of this class.
    **/
    @TestVisible
    private class PolymorphicFieldException extends Exception {}
}
