/**
 * Clase de utilidades relacionada con los metadatos de Salesforce
 */
public with sharing class MetadataUtil
{

    /**
     * Método que devuelve una lista de opciones con todos 
     * los objetos que se pueden crear 
     * @author              rcastanos
     * @return              una lista de opciones
     */
    @AuraEnabled (cacheable = true)
    public static List<OptionWrapper> getSalesforceObjects(String operation)
    {
        List<OptionWrapper> options = new List<OptionWrapper>();

        for (Schema.SObjectType sObjectType : Schema.getGlobalDescribe().values())
        {
            Schema.DescribeSObjectResult objResult = sObjectType.getDescribe();
            Boolean addObject = false;

            switch on operation.toLowerCase()
            {
                when  'insert'
                {
                    addObject = objResult.isCreateable() && objResult.isAccessible();
                }
                when  'update'
                {
                    addObject = objResult.isUpdateable() && objResult.isAccessible();
                }
                when  'upsert'
                {
                    addObject = objResult.isCreateable() && objResult.isUpdateable() && objResult.isAccessible();
                }
                when  'delete'
                {
                    addObject = objResult.isDeletable() && objResult.isAccessible();
                }
            }

            if(addObject)
            {
                options.add(new OptionWrapper(objResult.getLabel() + ' (' + objResult.getName() + ')', objResult.getName()));
            }
        }

        options.sort();

        return options;
    }

    /**
     * Método que devuelve una lista de opciones con todos 
     * los campos del objeto deseado 
     * @author              rcastanos
     * @param  objectType   objeto del que se quiere recuperar los campos
     * @param  operation    operación DML que se va a realizar
     * @return              una lista de opciones
     */
    @AuraEnabled (cacheable = true)
    public static List<OptionWrapper> getObjectFields(String objectType, String operation)
    {
        List<OptionWrapper> options = new List<OptionWrapper>();

        SObjectType type = Schema.getGlobalDescribe().get(objectType);
        
        Map<String,Schema.SObjectField> fields = type.getDescribe().fields.getMap();
        Boolean addField = false;
        Boolean addIdField = false;

        for(String fieldName : fields.keySet())
        {
            switch on operation.toLowerCase()
            {
                when  'insert'
                {
                    addField = fields.get(fieldName).getDescribe().isAccessible() && fields.get(fieldName).getDescribe().isCreateable();
                }
                when  'update'
                {
                    addField = fields.get(fieldName).getDescribe().isAccessible() && fields.get(fieldName).getDescribe().isUpdateable();
                    addIdField = true;
                }
                when  'upsert'
                {
                    addField = fields.get(fieldName).getDescribe().isAccessible() && fields.get(fieldName).getDescribe().isCreateable() && fields.get(fieldName).getDescribe().isUpdateable();
                    addIdField = true;
                }

            }

            if(fields.get(fieldName).getDescribe().isAccessible() && fields.get(fieldName).getDescribe().isCreateable())
            {
                options.add(new OptionWrapper(fields.get(fieldName).getDescribe().getLabel() + ' (' + fields.get(fieldName).getDescribe().getName() + ')', fields.get(fieldName).getDescribe().getName()));
            }
        }

        if(addIdField)
        {
            options.add(new OptionWrapper('Id', 'Id'));
        }

        options.sort();

        return options;
    }
}