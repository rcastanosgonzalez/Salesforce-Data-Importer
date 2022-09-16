/**
 * Clase wrapper para generar opciones de lightning-combobox ya formateadas
 */
public with sharing class OptionWrapper implements Comparable
{
    @AuraEnabled
    public String label {get; set;}
    @AuraEnabled
    public String value {get; set;}

    public OptionWrapper(String label, String value)
    {
        this.label = label;
        this.value = value;
    }

    /**
     * Método de la interfaz Comparable para ordernar OptionWrappers. 
     * Se utiliza para ordenar una lista por el atributo label 
     * alfabéticamente de forma descendente.  
     * @author              rcastanos
     * @param  compareTo    objeto que se va a comparar con el actual
     * @return              un Integer que indica si es menor, igual o mayor
     */
    public Integer compareTo(Object compareTo)
    {
        OptionWrapper compareToEmp = (OptionWrapper) compareTo;

        if (label == compareToEmp.label) return 0;
        if (label > compareToEmp.label) return 1;

        return -1;        
    }
}