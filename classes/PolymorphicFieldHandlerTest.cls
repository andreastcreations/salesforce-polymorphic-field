/**
 * @author       : Andreas Tsimpanogiannis
 * @version      : 1.0
 * @since        : 10/Feb/2022
 * </br>
 * @description  : Tests for the PolymorphicFieldHandler class
**/
@IsTest
private class PolymorphicFieldHandlerTest {
    
    @IsTest
    private static void makeSureMemberVariablesAreNotNull() {
        Test.startTest();

        System.assertNotEquals(
            null,
            PolymorphicFieldHandler.internal,
            'Should not be null');

        Test.stopTest();
    }

    @IsTest
    private static void validSearch() {
        PolymorphicFieldHandler.internal = (PolymorphicFieldHandlerInternal) Test.createStub(
            PolymorphicFieldHandlerInternal.class,
            new PolymorphicFieldHandlerInternal_MockSuccess());

        Test.startTest();

        // The internal method is mocked so we are not testing actual data
        String result = PolymorphicFieldHandler.getResults('Dummy', 'Account', 'parametersInJsonFormat');
        System.assertNotEquals(
            null,
            result,
            'Should not be null');
        System.assertEquals(
            true,
            result.contains('Dummy'),
            'Should contain the input query');

        Test.stopTest();
    }

    @IsTest
    private static void searchThatThrowsExceptionInternally() {
        PolymorphicFieldHandler.internal = (PolymorphicFieldHandlerInternal) Test.createStub(
            PolymorphicFieldHandlerInternal.class,
            new PolymorphicFieldHandlerInternal_MockError());

        Test.startTest();

        // The internal method is mocked so we are not testing actual data
        Boolean hasThrown = false;
        try {
            PolymorphicFieldHandler.getResults('Dummy', 'Inaccessible_DummyObject__c', 'parametersInJsonFormat');
        } catch (Exception ex) {
            hasThrown = ex instanceof AuraHandledException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw AuraHandledException');
        
        Test.stopTest();
    }
    
    @IsTest
    private static void invalidInputQuery() {
        PolymorphicFieldHandler.internal = (PolymorphicFieldHandlerInternal) Test.createStub(
            PolymorphicFieldHandlerInternal.class,
            new PolymorphicFieldHandlerInternal_MockError());

        Test.startTest();
        
        Boolean hasThrown = false;
        try {
            PolymorphicFieldHandler.getResults(null, 'SomeObject__c', 'parametersInJsonFormat');
        } catch (Exception ex) {
            hasThrown = ex instanceof AuraHandledException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw AuraHandledException');

        Test.stopTest();
    }

    @IsTest
    private static void invalidObjectApiName() {
        PolymorphicFieldHandler.internal = (PolymorphicFieldHandlerInternal) Test.createStub(
            PolymorphicFieldHandlerInternal.class,
            new PolymorphicFieldHandlerInternal_MockError());

        Test.startTest();

        Boolean hasThrown = false;
        try {
            PolymorphicFieldHandler.getResults('text to query', null, 'parametersInJsonFormat');
        } catch (Exception ex) {
            hasThrown = ex instanceof AuraHandledException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw AuraHandledException');

        Test.stopTest();
    }

    @IsTest
    private static void invalidJsonFieldsToSearchFor() {
        PolymorphicFieldHandler.internal = (PolymorphicFieldHandlerInternal) Test.createStub(
            PolymorphicFieldHandlerInternal.class,
            new PolymorphicFieldHandlerInternal_MockError());
            
        Test.startTest();

        Boolean hasThrown = false;
        try {
            PolymorphicFieldHandler.getResults('text to query', 'SomeObject__c', null);
        } catch (Exception ex) {
            hasThrown = ex instanceof AuraHandledException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw AuraHandledException');

        Test.stopTest();
    }

    private class PolymorphicFieldHandlerInternal_MockSuccess implements StubProvider {

        public Object handleMethodCall(
            Object stubbedObject,
            String stubbedMethodName,
            System.Type returnType,
            List<System.Type> listOfParamTypes,
            List<String> listOfParamNames,
            List<Object> listOfArgs) {

            Account tempAccount = new Account(Name='Dummy Account');
            insert tempAccount;
            return new List<SObject> { tempAccount };
        }
    }

    private class PolymorphicFieldHandlerInternal_MockError implements StubProvider {

        public Object handleMethodCall(
            Object stubbedObject,
            String stubbedMethodName,
            System.Type returnType,
            List<System.Type> listOfParamTypes,
            List<String> listOfParamNames,
            List<Object> listOfArgs) {

            throw new PolymorphicFieldHandlerInternal.PolymorphicFieldException('Dummy exception message');
        }
    }
}