/**
 * @author       : Andreas Tsimpanogiannis
 * @version      : 1.0
 * @since        : 06/Feb/2022
 * </br>
 * @description  : The controller that is used to retrieve data for the polymorphic field.
 *               It checks for empty parameters and sends the result of any operations
 *               that were handled internally.
**/
public with sharing class PolymorphicFieldHandler {

    @TestVisible
    private static PolymorphicFieldHandlerInternal internal = new PolymorphicFieldHandlerInternal();
    
    /**
     * @author      : Andreas Tsimpanogiannis
     * @version     : 1.0
     * @since       : 06/Feb/2022
     * </br>
     * @description : The method that gets called by the LWC. It requires some text to query for,
     *              the SObject API name and some additional parameters (fields to query, conditions
     *              and Ids to exclude).
     * </br>
     * @param       inputQuery {String} : The text we are looking for.
     * @param       objectApiName {String} : The SObject we want to query.
     * @param       jsonFieldsToSearchFor {String} : Details about the fields we are querying,
     *              as well as additional conditions.
     * @return      {String} : A List of SObjects in a JSON string format.
     * @throws      {AuraHandledException} : This exception is caught by the LWC. It provides the user
     *              with additional details like the exception message, type and stack trace.
    **/
    @AuraEnabled
    public static String getResults(
        String inputQuery,
        String objectApiName,
        String jsonFieldsToSearchFor){

        try {
            return JSON.serialize(
                internal.getQueryResults(
                    inputQuery,
                    objectApiName,
                    jsonFieldsToSearchFor
                )
            );

        } catch (Exception e) {
            throw new AuraHandledException(
                JSON.serialize(
                    new ExceptionDetails(
                        e.getMessage(),
                        e.getTypeName(),
                        e.getStackTraceString()
                    )
                )
            );
        }
    }

    /**
     * @author       : Andreas Tsimpanogiannis
     * @version      : 1.0
     * @since        : 06/Feb/2022
     * </br>
     * @description  : Private class that is used to return a more detailed
     *               exception to the frontend.
    **/
    @TestVisible
    private class ExceptionDetails {
        @TestVisible
        private String details;
        @TestVisible
        private String exceptionType;
        @TestVisible
        private String stackTrace;

        /**
         * @author       : Andreas Tsimpanogiannis
         * @version      : 1.0
         * @since        : 06/Feb/2022 
         * </br>
         * @description : The class constructor.
         * </br>
         * @param       details {String} : The Exception message (ex.getMessage())
         * @param       exceptionType {String} : The Exception type (ex.getTypeName())
         * @param       stackTrace {String} : The Exception stack trace (ex.getStackTraceString())
        **/
        public ExceptionDetails(
            String details,
            String exceptionType,
            String stackTrace) {
                
            this.details = details;
            this.exceptionType = exceptionType;
            this.stackTrace = stackTrace;
        }
    }
}
