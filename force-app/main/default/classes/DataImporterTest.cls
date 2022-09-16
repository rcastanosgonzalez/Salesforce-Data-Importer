/*Clase que contiene todos los métodos de test para la clase DataImporterService */

@isTest
public with sharing class DataImporterTest
{
    
    @isTest
    private static void insertAccounts_OK()
    {
        insertAccounts_OK_Util(2, false);
    }

    @isTest
    private static void insertAccounts_OK_massive()
    {
        insertAccounts_OK_Util(200, false);
    }

    @isTest
    private static void insertAccounts_OK_massive_draft()
    {
        insertAccounts_OK_Util(200, true);
    }

    @isTest
    private static void insertAccounts_OK_hipermassive()
    {
        insertAccounts_OK_Util(1000, false);
    }

    private static void insertAccounts_OK_Util(Integer amount, Boolean draftMode)
    {
        List<Account> accounts = TestUtil.generateAccounts(amount, true);
        String json = JSON.serialize(accounts);
        Map<String,List<String>> response = new Map<String,List<String>>();

        Test.startTest();
        response = DataImporterService.importData(json, 'Account', 'Insert', null, 0, draftMode);
        Test.stopTest();

        System.assert(response.get('errors').isEmpty(), 'No debería haberse registrado ningún error');
        System.assertEquals(amount, response.get('success').size(), 'Deberían haberse generado inserciones satisfactorias');

        List<Account> accountsReturned = [SELECT Id FROM Account];

        if(draftMode)
        {
            System.assertEquals(0, accountsReturned.size(), 'No deberían haberse insertado cuentas');
        }
        else
        {
            System.assertEquals(amount, accountsReturned.size(), 'Deberían haberse insertado cuentas');
        }
    }

    @isTest
    private static void insertAccounts_NOK()
    {
        insertAccounts_NOK_Util(2);
    }

    @isTest
    private static void insertAccounts_NOK_massive()
    {
        insertAccounts_NOK_Util(200);
    }

    @isTest
    private static void insertAccounts_NOK_hipermassive()
    {
        insertAccounts_NOK_Util(1000);
    }

    private static void insertAccounts_NOK_Util(Integer amount)
    {
        List<Account> accounts = TestUtil.generateAccounts(amount, false);
        String json = JSON.serialize(accounts);

        Map<String,List<String>> response = new Map<String,List<String>>();

        Test.startTest();
        response = DataImporterService.importData(json, 'Account', 'Insert', null, 0, false);
        Test.stopTest();

        System.assert(response.get('success').isEmpty(), 'No debería haberse generado ninguna inserción satisfactoria');
        System.assertEquals(amount, response.get('errors').size(), 'Deberían haberse generado dos errores por no contener el campo Name');

        List<Account> accountsReturned = [SELECT Id FROM Account];
        System.assertEquals(0, accountsReturned.size(), 'No deberían haberse creado cuentas');
    }

    @isTest
    private static void updateAccounts_OK()
    {
        updateAccounts_OK_Util(2, false);
    }

    @isTest
    private static void updateAccounts_OK_massive()
    {
        updateAccounts_OK_Util(200, false);
    }

    @isTest
    private static void updateAccounts_OK_massive_draft()
    {
        updateAccounts_OK_Util(200, true);
    }

    @isTest
    private static void updateAccounts_OK_hipermassive()
    {
        updateAccounts_OK_Util(1000, false);
    }

    private static void updateAccounts_OK_Util(Integer amount, Boolean draftMode)
    {
        List<Account> accounts = TestUtil.generateAccounts(amount, true);
        insert accounts;

        for(Account account : accounts)
        {
            account.Name = account.Name + ' Modified';
        }

        String json = JSON.serialize(accounts);

        Map<String,List<String>> response = new Map<String,List<String>>();

        Test.startTest();
        response = DataImporterService.importData(json, 'Account', 'Update', null, 0, draftMode);
        Test.stopTest();

        System.assert(response.get('errors').isEmpty(), 'No debería haberse registrado ningún error');
        System.assertEquals(amount, response.get('success').size(), 'Deberían haberse generado actualizaciones satisfactorias');

        List<Account> accountsReturned = [SELECT Id, Name FROM Account];
        System.assertEquals(amount, accountsReturned.size(), 'Deberían haberse insertado cuentas');

        for(Account accountReturned : accountsReturned)
        {
            if(draftMode)
            {
                System.assert(!accountReturned.Name.contains('Modified'), 'La cuenta se ha actualizado');
            }
            else
            {
                System.assert(accountReturned.Name.contains('Modified'), 'La cuenta no se han actualizado correctamente');
            }
        }
        
    }

    @isTest
    private static void updateAccounts_NOK()
    {
        updateAccounts_NOK_Util(2);
    }

    @isTest
    private static void updateAccounts_NOK_massive()
    {
        updateAccounts_NOK_Util(200);
    }

    @isTest
    private static void updateAccounts_NOK_hipermassive()
    {
        updateAccounts_NOK_Util(1000);
    }

    private static void updateAccounts_NOK_Util(Integer amount)
    {
        List<Account> accounts = TestUtil.generateAccounts(amount, true);
        insert accounts;

        for(Account account : accounts)
        {
            account.Name = null;
            account.Description = account.Description + ' Modified';
        }

        String json = JSON.serialize(accounts);

        Map<String,List<String>> response = new Map<String,List<String>>();

        Test.startTest();
        response = DataImporterService.importData(json, 'Account', 'Update', null, 0, false);
        Test.stopTest();

        System.assert(response.get('success').isEmpty(), 'No debería haberse generado ninguna actualización satisfactoria');
        System.assertEquals(amount, response.get('errors').size(), 'Deberían haberse generado errores por no contener el campo Name');

        List<Account> accountsReturned = [SELECT Id, Name, Description FROM Account];
        System.assertEquals(amount, accountsReturned.size(), 'Deberían haberse insertado cuentas');

        for(Account accountReturned : accountsReturned)
        {
            System.assert(!accountReturned.Description.contains('Modified'), 'La cuenta no se deberia haber actualizado');
        }
    }
    
    @isTest
    private static void upsertAccounts_OK()
    {
        upsertAccounts_OK_Util(2, false);
    }

    @isTest
    private static void upsertAccounts_OK_massive()
    {
        upsertAccounts_OK_Util(200, false);
    }

    @isTest
    private static void upsertAccounts_OK_massive_draft()
    {
        upsertAccounts_OK_Util(200, true);
    }

    @isTest
    private static void upsertAccounts_OK_hipermassive()
    {
        upsertAccounts_OK_Util(1000, false);
    }
    
    private static void upsertAccounts_OK_Util(Integer amount, Boolean draftMode)
    {

        List<Account> accounts = TestUtil.generateAccounts(amount, true);
        insert accounts;

        for(Account account : accounts)
        {
            account.Id = null;
            account.Description = account.Description + ' Modified';
        }

        Account account = new Account();
        account.Name = 'insert';
        account.Description = 'insertDescription';

        accounts.add(account);

        String json = JSON.serialize(accounts);

        Map<String,List<String>> response = new Map<String,List<String>>();

        Test.startTest();
        response = DataImporterService.importData(json, 'Account', 'Upsert', 'Name', 0, draftMode);
        Test.stopTest();

        System.assert(response.get('errors').isEmpty(), 'No debería haberse registrado ningún error');
        System.assertEquals(amount+1, response.get('success').size(), 'Deberían haberse generado actualizaciones satisfactorias');

        List<Account> accountsReturned = [SELECT Id, Description FROM Account];

        if(draftMode)
        {
            System.assertEquals(amount, accountsReturned.size(), 'No deberían haberse insertado más cuentas');
        }
        else
        {
            System.assertEquals(amount+1, accountsReturned.size(), 'Deberían haberse insertado cuentas');    
        }

        for(Account accountReturned : accountsReturned)
        {
            if(draftMode)
            {
                System.assert(!accountReturned.Description.contains('Modified') && !accountReturned.Description.contains('insert'), 'La cuenta no se tiene que actualizar');
            }
            else
            {
                System.assert(accountReturned.Description.contains('Modified') || accountReturned.Description.contains('insert'), 'La cuenta no se han actualizado correctamente');
            }
        }
    }

    @isTest
    private static void upsertAccounts_NOK()
    {
        upsertAccounts_NOK_Util(2);
    }

    @isTest
    private static void upsertAccounts_NOK_massive()
    {
        upsertAccounts_NOK_Util(200);
    }

    @isTest
    private static void upsertAccounts_NOK_hipermassive()
    {
        upsertAccounts_NOK_Util(1000);
    }

    private static void upsertAccounts_NOK_Util(Integer amount)
    {
        List<Account> accounts = TestUtil.generateAccounts(amount, true);
        insert accounts;

        for(Account account : accounts)
        {
            account.Id = null;
            account.Name = null;
            account.Description = account.Description + ' Modified';
        }

        Account account = new Account();
        account.Name = null;
        account.Description = 'insertDescription';

        accounts.add(account);

        String json = JSON.serialize(accounts);

        Map<String,List<String>> response = new Map<String,List<String>>();

        Test.startTest();
        response = DataImporterService.importData(json, 'Account', 'Upsert', 'Name', 0, false);
        Test.stopTest();

        System.assert(response.get('success').isEmpty(), 'No debería haberse generado ninguna actualización satisfactoria');
        System.assertEquals(amount+1, response.get('errors').size(), 'Deberían haberse generado errores por no contener el campo Name');

        List<Account> accountsReturned = [SELECT Id, Description FROM Account];
        System.assertEquals(amount, accountsReturned.size(), 'Deberían haberse insertado cuentas');

        for(Account accountReturned : accountsReturned)
        {
            System.assert(accountReturned.Description.contains('Description') , 'La cuenta no debería haberse actualizado');
        }
    }

    @isTest
    private static void deleteAccounts_OK()
    {
        deleteAccounts_OK_Util(2, false);
    }

    @isTest
    private static void deleteAccounts_OK_massive()
    {
        deleteAccounts_OK_Util(200, false);
    }

    @isTest
    private static void deleteAccounts_OK_massive_draft()
    {
        deleteAccounts_OK_Util(200, true);
    }

    @isTest
    private static void deleteAccounts_OK_hipermassive()
    {
        deleteAccounts_OK_Util(1000, false);
    }

    private static void deleteAccounts_OK_Util(Integer amount, Boolean draftMode)
    {
        List<Account> accounts = TestUtil.generateAccounts(amount, true);
        insert accounts;

        String json = JSON.serialize(accounts);

        Map<String,List<String>> response = new Map<String,List<String>>();

        Test.startTest();
        response = DataImporterService.importData(json, 'Account', 'Delete', null, 0, draftMode);
        Test.stopTest();

        System.assert(response.get('errors').isEmpty(), 'No debería haberse registrado ningún error');
        System.assertEquals(amount, response.get('success').size(), 'Deberían haberse generado borrados satisfactorios');

        List<Account> accountsReturned = [SELECT Id, Description FROM Account];

        if(draftMode)
        {
            System.assertEquals(amount, accountsReturned.size(), 'No deberían haberse borrado las cuentas');
        }
        else
        {
            System.assertEquals(0, accountsReturned.size(), 'No deberían haberse recuperado cuentas');
        }
    }
}