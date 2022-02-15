/**
 * @author       : Andreas Tsimpanogiannis
 * @version      : 1.0
 * @since        : 10/Feb/2022
 * </br>
 * @description  : Tests for the PolymorphicFieldHandlerInternal class
**/
@IsTest
private class PolymorphicFieldHandlerInternalTest {
    
    @IsTest
    private static void allValid() {
        PolymorphicFieldHandlerInternal handler = new PolymorphicFieldHandlerInternal();
        String inputQuery = 'Dummy';
        String objectApiName = 'Account';
        String jsonFieldsToSearchFor =
        '{' +
            '"optionLabelApiName": "Name",' +
            '"optionCommentApiName": "AnnualRevenue",' +
            '"conditions": ["Website != null", "AnnualRevenue < 200.00"],' +
            '"excludeIds": ["000011112222ABCD00"]' +
        '}';

        Test.startTest();

        List<Account> newAccountsList = new List<Account> {
            new Account(
                Name='Dummy First Account',
                Phone='0123456789',
                Website='www.dummywebsiteaddress.com',
                AnnualRevenue=100.00
            ),
            new Account(
                Name='Dummy Second Account',
                Phone='5556667777',
                AnnualRevenue=500.00
            )
        };
        insert newAccountsList;

        List<SObject> objectList = handler.getQueryResults(inputQuery, objectApiName, jsonFieldsToSearchFor);
        
        System.assertNotEquals(null, objectList, 'Return not null list');
        System.assertEquals(1, objectList.size(), 'Return list size should be 1');
        System.assertEquals(Account.getSObjectType(), objectList[0].getSObjectType(), 'Should return an Account');
        System.assertEquals('Dummy First Account', ((Account)objectList[0]).Name, 'Should return the Dummy First Account');

        Test.stopTest();
    }

    @IsTest
    private static void invalidInputQuery() {
        PolymorphicFieldHandlerInternal handler = new PolymorphicFieldHandlerInternal();

        Test.startTest();

        Boolean hasThrown = false;
        try {
            handler.getQueryResults(null, 'Account', 'additionalData');
        } catch (Exception ex) {
            hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw PolymorphicFieldException');

        Test.stopTest();
    }

    @IsTest
    private static void invalidJsonFieldsToSearchFor() {
        PolymorphicFieldHandlerInternal handler = new PolymorphicFieldHandlerInternal();

        Test.startTest();

        Boolean hasThrown = false;
        try {
            handler.getQueryResults('some query', 'SomeSObject__c', null);
        } catch (Exception ex) {
            hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw PolymorphicFieldException');

        Test.stopTest();
    }

    @IsTest
    private static void invalidObjectApiName() {
        PolymorphicFieldHandlerInternal handler = new PolymorphicFieldHandlerInternal();

        Test.startTest();

        // Test null SObject name for main method
        Boolean hasThrown = false;
        try {
            handler.getQueryResults('some query', null, 'additionalData');
        } catch (Exception ex) {
            hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw PolymorphicFieldException');

        // Test null SObject name for private test visible method
        hasThrown = false;
        try {
            handler.getSObjectType(null);
        } catch (Exception ex) {
            hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw PolymorphicFieldException');

        // Reset boolean, test invalid SObject
        hasThrown = false;
        try {
            handler.getSObjectType('Accountttttt');
        } catch (Exception ex) {
            hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw PolymorphicFieldException');
        
        // Reset boolean, test valid SObject that is not Searchable
        hasThrown = false;
        try {
            // Most of the (SomeObject)History SObjects are not Searchable
            handler.getSObjectType('ContentDocumentHistory');
        } catch (Exception ex) {
            hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw PolymorphicFieldException');

        Test.stopTest();
    }

    @IsTest
    private static void invalidSObjectField() {
        PolymorphicFieldHandlerInternal handler = new PolymorphicFieldHandlerInternal();

        Test.startTest();

        // Test null SObjectType
        Boolean hasThrown = false;
        try {
            handler.getSObjectField('Name', null);
        } catch (Exception ex) {
            hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw PolymorphicFieldException');

        // Reset boolean, test Id search
        hasThrown = false;
        try {
            handler.getSObjectField('Id', Account.getSObjectType());
        } catch (Exception ex) {
            hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
        }
        System.assertEquals(
            true,
            hasThrown,
            'Should throw PolymorphicFieldException');

        // Test null field API name
        Schema.SObjectField field = handler.getSObjectField(null, Account.getSObjectType());
        System.assertEquals(
            null,
            field,
            'Should return null');

        // Test inaccessible field by user
        Profile standardUser = [
            SELECT Id
            FROM Profile
            WHERE Name = 'Standard User'
        ];
        User fakeUser = new User(Alias = 'fakesu',
                                Email = 'fakestandarduser@fakemail.com',
                                EmailEncodingKey = 'UTF-8',
                                LastName = 'Fakelastname',
                                LanguageLocaleKey = 'en_US',
                                LocaleSidKey = 'en_US',
                                ProfileId = standardUser.Id,
                                TimeZoneSidKey = 'America/Los_Angeles',
                                UserName = 'fakestandarduser' + DateTime.now().getTime() + '@fakemail.com');
        insert fakeUser;

        System.runAs(fakeUser){
            // Reset boolean
            hasThrown = false;
            try {
                // The ContractId on Opportunity is not accessible for the default Standard User
                handler.getSObjectField('ContractId', Opportunity.getSObjectType());
            } catch (Exception ex) {
                hasThrown = ex instanceof PolymorphicFieldHandlerInternal.PolymorphicFieldException;
            }
            System.assertEquals(
                true,
                hasThrown,
                'Should throw PolymorphicFieldException');
        }

        Test.stopTest();
    }
}
