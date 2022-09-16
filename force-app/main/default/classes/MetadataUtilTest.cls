/*Clase que contiene todos los métodos de test para la clase MetadataUtil */
@isTest
public with sharing class MetadataUtilTest
{
    @isTest
    private static void getSalesforceObjects_insert()
    {
        List<OptionWrapper> objects= MetadataUtil.getSalesforceObjects('insert');

        System.assert(!objects.isEmpty());
    }

    @isTest
    private static void getSalesforceObjects_update()
    {
        List<OptionWrapper> objects= MetadataUtil.getSalesforceObjects('update');

        System.assert(!objects.isEmpty());
    }

    @isTest
    private static void getSalesforceObjects_upsert()
    {
        List<OptionWrapper> objects= MetadataUtil.getSalesforceObjects('upsert');

        System.assert(!objects.isEmpty());
    }

    @isTest
    private static void getSalesforceObjects_delete()
    {
        List<OptionWrapper> objects= MetadataUtil.getSalesforceObjects('delete');

        System.assert(!objects.isEmpty());
    }

    @isTest
    private static void getAccountFields_insert()
    {
        List<OptionWrapper> fields= MetadataUtil.getObjectFields('Account', 'insert');

        System.assert(!fields.isEmpty());
    }

    @isTest
    private static void getAccountFields_update()
    {
        List<OptionWrapper> fields= MetadataUtil.getObjectFields('Account', 'update');

        System.assert(!fields.isEmpty());
    }

    @isTest
    private static void getAccountFields_upsert()
    {
        List<OptionWrapper> fields= MetadataUtil.getObjectFields('Account', 'upsert');

        System.assert(!fields.isEmpty());
    }
}