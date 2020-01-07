<?php
/**
 * Created by PhpStorm.
 * User: HP PC
 * Date: 02/01/2020
 * Time: 18:29
 */

$manager = new MongoDB\Driver\Manager('mongodb://127.0.0.1:27017');

$json_obj = json_decode(file_get_contents('php://input'));

$filter = [];       //'typeElm' => 'elmPoste', 'location' => 'a'
$option = [
    //'sort' => ['_id' => -1]
];

foreach ($json_obj as $item => $value){
    if($item === 'departActuel')  $filter[$item] = $value;
    /*if($item === 'ordre'){
        foreach ($value as $item1 => $value1){
            $filter[$item] = [$item1 => new MongoDB\BSON\Regex($value1)];
        }
    }*/
}

/*var_dump($filter);

var_dump($json_obj);*/

$query = new MongoDB\Driver\Query($json_obj, $option);

$result = $manager->executeQuery('scadaEneo.stockElm', $query);

echo json_encode(iterator_to_array($result, false));
