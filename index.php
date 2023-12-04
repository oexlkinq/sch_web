<?php

const methodsValidation = [
    'getPairs.group' => [
        'date' => 'evalStringDate',
        'target' => 'evalString',
        'week' => 'evalCheckbox',
    ],
    'getPairs.query' => [
        'date' => 'evalStringDate',
        'target' => 'evalString',
        'week' => 'evalCheckbox',
    ],
    'getGroups' => [],
    'getTeachers' => [],

    'groups.get' => [],
    'teachers.get' => [],

    'pairs.get' => [
        'date' => 'evalStringDate',
        'week' => 'evalCheckbox',
        '@target' => [
            'teacherId' => 'evalNumber',
            'teacherLogin' => 'evalString',
            'groupId' => 'evalNumber',
            'groupName' => 'evalString',
            'query' => 'evalQuery',
        ],
    ],
];

if(!array_key_exists('method', $_REQUEST) || !array_key_exists($_REQUEST['method'], methodsValidation)){
    sendResult("неизвестное значение параметра \"method\"", false, 400);
}

$errors = [];
$evaled = ['method' => $_REQUEST['method']];
foreach(methodsValidation[$_REQUEST['method']] as $argName => $valFunc){
    try{
        if($argName[0] === '@'){
            $argsGroupName = $argName;
            $argsGroup = $valFunc;
            $argsProcessed = 0;
            foreach($argsGroup as $argName => $valFunc){
                if(array_key_exists($argName, $_REQUEST)){
                    try{
                        $valRes = $valFunc($_REQUEST[$argName]);
                    }catch(Exception $e){
                        throw new Exception($e->getMessage() . " (параметр \"$argName\")", 0, $e);
                    }

                    $evaled[$argsGroupName] = [$argName => $valRes];
                    $argsProcessed++;

                    break;
                }
            }

            if($argsProcessed === 0){
                throw new Exception('должен быть указан один из параметров группы: ' . implode(', ', $argsGroup));
            }
        }else{
            if(!array_key_exists($argName, $_REQUEST)){
                throw new ErrorException("не указан обязательный параметр \"$argName\"");
            }
    
            $evaled[$argName] = $valFunc($_REQUEST[$argName]);
        }
    }catch(Exception $e){
        $errors[] = $e->getMessage();
    }
}

if(count($errors) > 0){
    sendResult($errors, false, 400);
}


$method = $evaled['method'];
$res = [];

$funcName = str_replace('.', '_', $evaled['method']);
call_user_func($funcName, $evaled);


function pairs_get(array $evaled){
    $week = $evaled['week'];
    $shift = ($week) ? 5 : 0;

    $res = [];

    $targetKey = array_keys($evaled['@target'])[0];
    $target = $evaled['@target'][$targetKey];

    if($targetKey === 'teacherId'){
        $res = mustQuery("select p.date, p.num, p.text || ( select ' (' || string_agg(distinct g.name, ', ' order by g.name asc) || ')' from groupsOfPairs gop inner join groups g on g.id = gop.group_id where gop.pair_id = p.id ) as text from pairs p inner join teachersOfPairs top on p.id = top.pair_id where top.teacher_id = $1 and date >= $2 and (date <= $2::date + $3::int) order by p.date asc, p.num asc", [
            $target,
            $evaled['date'],
            $shift,
        ]);
    }else if($targetKey === 'teacherLogin'){
        $res = mustQuery("select p.date, p.num, p.text || ( select ' (' || string_agg( distinct g.name, ', ' order by g.name asc ) || ')' from groupsOfPairs gop inner join groups g on g.id = gop.group_id where gop.pair_id = p.id ) as text from pairs p inner join teachersOfPairs top on p.id = top.pair_id inner join teachers t on t.id = top.teacher_id where t.login = $1 and date >= $2 and (date <= $2::date + $3::int) order by p.date asc, p.num asc", [
            $target,
            $evaled['date'],
            $shift,
        ]);
    }else if($targetKey === 'groupId'){
        $res = mustQuery("select p.date, p.text, p.num from pairs p inner join groupsofpairs gop on p.id = gop.pair_id where p.date >= $2 and p.date <= ($2::date + $3::int) and gop.group_id = $1 order by p.date asc, p.num asc", [
            $target,
            $evaled['date'],
            $shift,
        ]);
    }else if($targetKey === 'groupName'){
        $res = mustQuery("select p.date, p.text, p.num from pairs p inner join groupsofpairs gop on p.id = gop.pair_id inner join groups g on g.id = gop.group_id where p.date >= $2 and p.date <= ($2::date + $3::int) and g.name = $1 order by p.date asc, p.num asc", [
            $target,
            $evaled['date'],
            $shift,
        ]);
    }else if($targetKey === 'query'){
        $res = mustQuery("select p.date, p.num, p.text || ( select ' (' || string_agg(groups.name, ', ') || ')' from groupsOfPairs gop inner join groups on groups.id = gop.group_id where pair_id = p.id group by pair_id ) as text from pairs p where lower(text) like lower($1) and date >= $2 and (date <= $2::date + $3::int) order by p.date asc, num asc limit 300", [
            "%$target%",
            $evaled['date'],
            $shift,
        ]);
    }

    foreach($res as $rowkey => $row){
        $res[$rowkey]['num'] = intval($row['num']);
    }

    $res = array_groupBy($res, 'date', 'pairs');

    sendResult($res);
}


function groups_get(array $evaled){
    $res = mustQuery("select g.id, g.name, f.display_name as faculty from groups g inner join faculties f on g.faculty_id = f.id order by f.display_name asc, g.name asc");

    foreach($res as $rowkey => $row){
        $res[$rowkey]['id'] = intval($row['id']);
    }

    $res = array_groupBy($res, 'faculty', 'groups');

    sendResult($res);
}

function teachers_get(array $evaled){
    $res = mustQuery("select id, name, url from teachers order by name asc");

    foreach($res as $rowkey => $row){
        $res[$rowkey]['id'] = intval($row['id']);
    }

    sendResult($res);
}

function getPairs_group(array $evaled){
    $week = $evaled['week'];
    $shift = ($week) ? 5 : 0;

    $res = mustQuery("select p.date, p.num, p.text from pairs p inner join groupsofpairs gop on p.id = gop.pair_id where p.date >= $1 and p.date <= ($1::date + $3::int) and gop.group_id = ( select id from groups where name = $2 ) order by p.date asc, p.num asc", [
        $evaled['date'],
        $evaled['target'],
        $shift,
    ]);

    $res = array_groupBy($res, 'date', 'pairs');

    foreach($res as $rowkey => $row){
        foreach($row['pairs'] as $pairkey => $pair){
            $res[$rowkey]['pairs'][$pairkey]['num'] = intval($pair['num']);
        }
    }

    sendResult($res);
}

function getPairs_query(array $evaled){
    $week = $evaled['week'];
    $shift = ($week) ? 5 : 0;

    $res = mustQuery("select p.date, p.num, p.text || ( select ' (' || string_agg(groups.name, ', ') || ')' from groupsOfPairs gop inner join groups on groups.id = gop.group_id where pair_id = p.id group by pair_id ) as text from pairs p where lower(text) like lower($1) and date >= $2 and (date <= $2::date + $3::int) order by p.date asc, num asc limit 300", [
        "%" . $evaled['target'] . "%",
        $evaled['date'],
        $shift,
    ]);

    $res = array_groupBy($res, 'date', 'pairs');

    foreach($res as $rowkey => $row){
        foreach($row['pairs'] as $pairkey => $pair){
            $res[$rowkey]['pairs'][$pairkey]['num'] = intval($pair['num']);
        }
    }

    sendResult($res);
}


function mustQuery(string $query, $params = []){
    $db = pg_connect("host=localhost dbname=sch user=obs");
    if(!$db){
        sendResult("db error", false, 500, 1);
    }

    $qres = pg_query_params($db, $query, $params);
    if($qres === false){
        $err = pg_last_error($db);
        error_log($err);
        sendResult("db error ($err)", false, 500, 1);
    }

    $fres = pg_fetch_all($qres);
    if($fres === false){
        $fres = [];
    }

    return $fres;
}

function array_groupBy($arr, $keyOfKey, $keyOfRest){
    $res = [];
    $groups = [];
    foreach($arr as $row){
        $key = $row[$keyOfKey];
        if(!array_key_exists($key, $groups)){
            $res[] = [
                $keyOfKey => $key,
                $keyOfRest => [],
            ];

            $groups[$key] = count($res) - 1;
        }

        $rowDup = $row;
        unset($rowDup[$keyOfKey]);
        $index = $groups[$key];
        $res[$index][$keyOfRest][] = $rowDup;
    }

    return $res;
}


function sendResult($data, $ok = true, $code = 200, $exitCode = 0){
    header('Access-Control-Allow-Origin: *');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => $ok,
        (($ok) ? 'result' : 'error') => $data,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if($exitCode >= 0){
        exit($exitCode);
    }
}

function evalStringDate($stringDate){
    if(date_create($stringDate) === false){
        throw new ErrorException('неверный формат даты');
    }

    return $stringDate;
}

function evalString($string){
    if(strlen($string) > 256){
        throw new ErrorException('слишком длинная строка');
    }
    return $string;
}

function evalNumber($number){
    $number = intval($number);
    if($number === 0){
        throw new ErrorException('неверный формат числа');
    }

    return $number;
}

function evalCheckbox($checkbox){
    return $checkbox === '1';
}

function evalQuery($query){
    if(strlen($query) < 3){
        throw new Exception('слишком общий запрос');
    }

    $specialSymbols = ' %_';
    $specialSymbCount = 0;
    for($i = 0; $i < strlen($query); $i++){
        for($j = 0; $j < strlen($specialSymbols); $j++){
            if($specialSymbols[$j] === $query[$i]){
                $specialSymbCount++;
            }
        }
    }

    if($specialSymbCount / strlen($query) > 0.25){
        throw new Exception('слишком общий запрос');
    }

    return $query;
}