public with sharing class Util
{    
    /**
     * Método que a partir de una lista de objetos retorna un mapa
     * con la clave del campo del objeto especificado y el objeto 
     * @author              rcastanos
     * @param  objects      lista de objetos del cual se confeccionará el mapa
     * @param  fieldName    nombre del campo que va a ser clave del mapa
     * @return              un mapa clave - registro
     */
    public static Map<String,SObject> getObjectMap(List<SObject> objects, String fieldName)
    {
        System.debug('Util - getObjectMap');

        Map<String,SObject> idObjectMap = new Map<String,SObject>();

        for(SObject obj : objects)
        {
            idObjectMap.put(String.valueOf(obj.get(fieldName)), obj);
        }

        return idObjectMap;

    }
}