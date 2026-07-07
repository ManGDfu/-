SET NOCOUNT ON;

/*
Prerequisite: run er_schema.sql first to create tables and indexes.
Optional:
USE PreMadeFoodDB;
GO
*/

/* Seed data: master data */
INSERT INTO dbo.sys_role(role_id, role_name, permission_desc)
VALUES
('ROL001', N'系统管理员', N'拥有全部系统权限'),
('ROL002', N'采购专员', N'负责采购订单与供应商管理'),
('ROL003', N'仓库管理员', N'负责仓储、库存与调拨管理'),
('ROL004', N'销售文员', N'负责销售订单与门店管理');

;WITH user_names AS (
    SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn,
           username, real_name
    FROM (VALUES
        ('zhangwei', N'张伟'), ('lina', N'李娜'), ('wangfang', N'王芳'),
        ('liuyang', N'刘洋'), ('chenjing', N'陈静'), ('yangming', N'杨明'),
        ('zhaoli', N'赵丽'), ('huangqiang', N'黄强'), ('zhoumin', N'周敏'),
        ('wugang', N'吴刚'), ('xuting', N'徐婷'), ('sunhao', N'孙浩'),
        ('mali', N'马丽'), ('zhujun', N'朱军'), ('huxue', N'胡雪'),
        ('guolei', N'郭磊'), ('helin', N'何琳'), ('gaofeng', N'高峰'),
        ('linjuan', N'林娟'), ('luobin', N'罗斌')
    ) v(username, real_name)
)
INSERT INTO dbo.sys_user(user_id, role_id, username, login_password, real_name, contact_phone)
SELECT
    CONCAT('USR', RIGHT('0000' + CAST(u.rn AS VARCHAR(4)), 4)),
    CONCAT('ROL', RIGHT('000' + CAST(((u.rn - 1) % 4) + 1 AS VARCHAR(3)), 3)),
    u.username,
    'Pass@123',
    u.real_name,
    CONCAT('1390000', RIGHT('0000' + CAST(u.rn AS VARCHAR(4)), 4))
FROM user_names u;

;WITH suppliers AS (
    SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn,
           supplier_name, contact_person, address
    FROM (VALUES
        (N'绿源生鲜供应链', N'王建国', N'山东省寿光市蔬菜大道168号'),
        (N'鲜丰农产品批发', N'李秀英', N'江苏省南京市江宁区农产品物流园A区12号'),
        (N'华北肉类供货中心', N'张志强', N'河北省石家庄市正定县肉类加工园5号'),
        (N'江南蔬菜基地', N'陈美玲', N'浙江省杭州市萧山区绿野路88号'),
        (N'海天调味供应商', N'刘德明', N'广东省佛山市南海区调味食品城3栋'),
        (N'川渝食材集散中心', N'赵国庆', N'四川省成都市双流区冷链物流港B区'),
        (N'齐鲁粮油贸易公司', N'孙丽华', N'山东省济南市历城区粮油批发市场18号'),
        (N'岭南水产批发', N'周海涛', N'广东省广州市番禺区水产交易中心6区'),
        (N'内蒙牛羊肉专营', N'巴特尔', N'内蒙古呼和浩特市玉泉区牛羊交易市场'),
        (N'东北优质大米供应', N'高建国', N'黑龙江省哈尔滨市松北区粮食产业园2号'),
        (N'徽府干货商行', N'吴春梅', N'安徽省合肥市包河区干货市场9号'),
        (N'闽南冷冻食品', N'林志远', N'福建省厦门市同安区冷冻食品工业园'),
        (N'云贵高原菌菇', N'杨秀兰', N'云南省昆明市官渡区菌菇交易大厅'),
        (N'西北马铃薯基地', N'马文斌', N'甘肃省定西市安定区马铃薯产业园'),
        (N'华中禽蛋批发', N'胡晓燕', N'湖北省武汉市黄陂区禽蛋集散中心'),
        (N'珠江三角洲净菜', N'黄伟明', N'广东省东莞市虎门镇净菜加工基地'),
        (N'长三角冷链物流', N'徐静', N'上海市嘉定区冷链仓储物流园1号库'),
        (N'环渤海海鲜直供', N'郑大海', N'天津市滨海新区海鲜批发市场3区'),
        (N'成渝预制原料', N'罗敏', N'重庆市渝北区预制菜原料供应中心'),
        (N'豫湘调味总汇', N'何建军', N'河南省郑州市中牟县调味品产业园'),
        (N'桂闽干货集采', N'梁秀珍', N'广西壮族自治区南宁市江南区干货城'),
        (N'甘宁特色农货', N'白志刚', N'宁夏银川市贺兰县农产品集散中心'),
        (N'新疆优质果蔬', N'阿依古丽', N'新疆乌鲁木齐市头屯河区果蔬物流园'),
        (N'青藏牦牛肉供', N'扎西顿珠', N'青海省西宁市城北区肉类冷链中心'),
        (N'海南热带水果', N'陈海南', N'海南省海口市秀英区热带水果批发市场'),
        (N'贵州辣椒基地', N'龙飞', N'贵州省遵义市虾子镇辣椒产业园'),
        (N'陕西面食原料', N'韩梅', N'陕西省西安市未央区面食原料供应站'),
        (N'河北蛋品联营', N'冯国栋', N'河北省衡水市蛋品加工产业园'),
        (N'安徽豆腐制品', N'沈玉兰', N'安徽省淮南市八公山区豆腐文化园'),
        (N'江西米粉供应', N'熊伟', N'江西省南昌市新建区米粉加工基地')
    ) v(supplier_name, contact_person, address)
)
INSERT INTO dbo.supplier(supplier_id, supplier_name, contact_person, contact_phone, address)
SELECT
    CONCAT('SUP', RIGHT('0000' + CAST(s.rn AS VARCHAR(4)), 4)),
    s.supplier_name,
    s.contact_person,
    CONCAT('1381000', RIGHT('0000' + CAST(s.rn AS VARCHAR(4)), 4)),
    s.address
FROM suppliers s;

;WITH ingredient_pool AS (
    SELECT ingredient_name, unit, category
    FROM (VALUES
        (N'土豆', N'千克', N'蔬菜'), (N'红薯', N'千克', N'蔬菜'), (N'胡萝卜', N'千克', N'蔬菜'),
        (N'白萝卜', N'千克', N'蔬菜'), (N'大白菜', N'千克', N'蔬菜'), (N'娃娃菜', N'千克', N'蔬菜'),
        (N'菠菜', N'千克', N'蔬菜'), (N'空心菜', N'千克', N'蔬菜'), (N'芹菜', N'千克', N'蔬菜'),
        (N'韭菜', N'千克', N'蔬菜'), (N'青椒', N'千克', N'蔬菜'), (N'彩椒', N'千克', N'蔬菜'),
        (N'西红柿', N'千克', N'蔬菜'), (N'黄瓜', N'千克', N'蔬菜'), (N'西葫芦', N'千克', N'蔬菜'),
        (N'茄子', N'千克', N'蔬菜'), (N'长豆角', N'千克', N'蔬菜'), (N'莲藕', N'千克', N'蔬菜'),
        (N'山药', N'千克', N'蔬菜'), (N'南瓜', N'千克', N'蔬菜'), (N'冬瓜', N'千克', N'蔬菜'),
        (N'苦瓜', N'千克', N'蔬菜'), (N'莴笋', N'千克', N'蔬菜'), (N'茭白', N'千克', N'蔬菜'),
        (N'芦笋', N'千克', N'蔬菜'), (N'西兰花', N'千克', N'蔬菜'), (N'花菜', N'千克', N'蔬菜'),
        (N'包菜', N'千克', N'蔬菜'), (N'生菜', N'千克', N'蔬菜'), (N'油麦菜', N'千克', N'蔬菜'),
        (N'小白菜', N'千克', N'蔬菜'), (N'上海青', N'千克', N'蔬菜'), (N'蒜苔', N'千克', N'蔬菜'),
        (N'荷兰豆', N'千克', N'蔬菜'), (N'蚕豆', N'千克', N'蔬菜'), (N'毛豆', N'千克', N'蔬菜'),
        (N'甜玉米', N'千克', N'蔬菜'), (N'芋头', N'千克', N'蔬菜'), (N'百合', N'千克', N'蔬菜'),
        (N'竹笋', N'千克', N'蔬菜'), (N'金针菇', N'千克', N'蔬菜'), (N'香菇', N'千克', N'蔬菜'),
        (N'平菇', N'千克', N'蔬菜'), (N'杏鲍菇', N'千克', N'蔬菜'), (N'口蘑', N'千克', N'蔬菜'),
        (N'豆腐', N'千克', N'蔬菜'), (N'嫩豆腐', N'千克', N'蔬菜'), (N'豆干', N'千克', N'蔬菜'),
        (N'腐竹', N'千克', N'蔬菜'), (N'豆皮', N'千克', N'蔬菜'), (N'猪里脊', N'千克', N'肉类'),
        (N'猪五花', N'千克', N'肉类'), (N'猪排骨', N'千克', N'肉类'), (N'猪绞肉', N'千克', N'肉类'),
        (N'鸡胸肉', N'千克', N'肉类'), (N'鸡腿肉', N'千克', N'肉类'), (N'鸡翅中', N'千克', N'肉类'),
        (N'鸡翅根', N'千克', N'肉类'), (N'整鸡', N'千克', N'肉类'), (N'鸭腿', N'千克', N'肉类'),
        (N'鸭胸肉', N'千克', N'肉类'), (N'牛腱子', N'千克', N'肉类'), (N'牛腩', N'千克', N'肉类'),
        (N'牛排', N'千克', N'肉类'), (N'羊肉片', N'千克', N'肉类'), (N'羊排', N'千克', N'肉类'),
        (N'培根', N'千克', N'肉类'), (N'火腿', N'千克', N'肉类'), (N'香肠', N'千克', N'肉类'),
        (N'腊肠', N'千克', N'肉类'), (N'午餐肉', N'千克', N'肉类'), (N'猪肚', N'千克', N'肉类'),
        (N'猪耳', N'千克', N'肉类'), (N'鸡爪', N'千克', N'肉类'), (N'鸭掌', N'千克', N'肉类'),
        (N'虾仁', N'千克', N'肉类'), (N'基围虾', N'千克', N'肉类'), (N'带鱼片', N'千克', N'肉类'),
        (N'鲈鱼块', N'千克', N'肉类'), (N'鳕鱼', N'千克', N'肉类'), (N'三文鱼', N'千克', N'肉类'),
        (N'鱿鱼圈', N'千克', N'肉类'), (N'花甲', N'千克', N'肉类'), (N'扇贝肉', N'千克', N'肉类'),
        (N'蛤蜊', N'千克', N'肉类'), (N'墨鱼', N'千克', N'肉类'), (N'鱼豆腐', N'千克', N'肉类'),
        (N'蟹棒', N'千克', N'肉类'), (N'花蛤', N'千克', N'肉类'), (N'黄花鱼', N'千克', N'肉类'),
        (N'食盐', N'千克', N'调料'), (N'白砂糖', N'千克', N'调料'), (N'冰糖', N'千克', N'调料'),
        (N'生抽', N'升', N'调料'), (N'老抽', N'升', N'调料'), (N'料酒', N'升', N'调料'),
        (N'香醋', N'升', N'调料'), (N'蚝油', N'升', N'调料'), (N'鱼露', N'升', N'调料'),
        (N'芝麻油', N'升', N'调料'), (N'花生油', N'升', N'调料'), (N'菜籽油', N'升', N'调料'),
        (N'玉米淀粉', N'千克', N'调料'), (N'土豆淀粉', N'千克', N'调料'), (N'小麦面粉', N'千克', N'调料'),
        (N'大米', N'千克', N'其他'), (N'糯米', N'千克', N'其他'), (N'鸡精', N'千克', N'调料'),
        (N'味精', N'千克', N'调料'), (N'白胡椒粉', N'千克', N'调料'), (N'黑胡椒粉', N'千克', N'调料'),
        (N'花椒', N'千克', N'调料'), (N'干辣椒', N'千克', N'调料'), (N'八角', N'千克', N'调料'),
        (N'桂皮', N'千克', N'调料'), (N'香叶', N'千克', N'调料'), (N'生姜', N'千克', N'调料'),
        (N'大蒜', N'千克', N'调料'), (N'大葱', N'千克', N'调料'), (N'小葱', N'千克', N'调料'),
        (N'豆瓣酱', N'千克', N'调料'), (N'甜面酱', N'千克', N'调料'), (N'番茄酱', N'千克', N'调料'),
        (N'花生酱', N'千克', N'调料'), (N'芝麻酱', N'千克', N'调料'), (N'腐乳', N'千克', N'调料'),
        (N'面包糠', N'千克', N'其他'), (N'粉丝', N'千克', N'其他'), (N'宽粉', N'千克', N'其他'),
        (N'意大利面', N'千克', N'其他'), (N'年糕', N'千克', N'其他'), (N'芝士', N'千克', N'其他'),
        (N'黄油', N'千克', N'其他'), (N'鸡蛋', N'千克', N'其他'), (N'牛奶', N'升', N'其他'),
        (N'淡奶油', N'升', N'其他')
    ) v(ingredient_name, unit, category)
),
ingredients AS (
    SELECT TOP (120) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn,
           ingredient_name, unit, category
    FROM ingredient_pool
)
INSERT INTO dbo.ingredient(ingredient_id, ingredient_name, unit, category, shelf_life_days)
SELECT
    CONCAT('ING', RIGHT('0000' + CAST(i.rn AS VARCHAR(4)), 4)),
    i.ingredient_name,
    i.unit,
    i.category,
    30 + (i.rn % 180)
FROM ingredients i;

;WITH warehouses AS (
    SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn,
           warehouse_name, warehouse_location, temperature_type
    FROM (VALUES
        (N'华东冷冻一号库', N'上海市嘉定区冷链仓储物流园1号库', 'FROZEN'),
        (N'华东冷藏二号库', N'江苏省苏州市工业园区冷藏中心', 'CHILLED'),
        (N'华北常温库', N'北京市大兴区常温仓储基地A区', 'NORMAL'),
        (N'西南冷冻库', N'四川省成都市双流区冷冻仓储中心', 'FROZEN'),
        (N'华南冷藏库', N'广东省广州市白云区冷藏物流园', 'CHILLED'),
        (N'华中恒温库', N'湖北省武汉市东西湖区恒温仓储园', 'NORMAL'),
        (N'东北冷冻库', N'辽宁省沈阳市于洪区冷冻食品库', 'FROZEN'),
        (N'西北常温库', N'陕西省西安市未央区常温配送中心', 'NORMAL')
    ) v(warehouse_name, warehouse_location, temperature_type)
)
INSERT INTO dbo.warehouse(warehouse_id, warehouse_name, warehouse_location, warehouse_capacity, temperature_type)
SELECT
    CONCAT('WAR', RIGHT('0000' + CAST(w.rn AS VARCHAR(4)), 4)),
    w.warehouse_name,
    w.warehouse_location,
    5000 + w.rn * 800,
    w.temperature_type
FROM warehouses w;

;WITH factories AS (
    SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn,
           factory_name, factory_location, manager_name
    FROM (VALUES
        (N'绿鲜预制菜中央厨房', N'上海市浦东新区食品工业园18号', N'陈建国'),
        (N'味佳食品加工中心', N'江苏省无锡市新吴区预制菜产业园', N'李志强'),
        (N'康达冷链预制工厂', N'山东省青岛市城阳区冷链加工基地', N'王德福'),
        (N'食尚快餐料理厂', N'广东省佛山市顺德区中央厨房', N'张美华'),
        (N'鲜达净菜加工基地', N'浙江省宁波市北仑区净菜产业园', N'刘国庆'),
        (N'优品熟食生产中心', N'四川省成都市郫都区食品加工厂', N'赵文静')
    ) v(factory_name, factory_location, manager_name)
)
INSERT INTO dbo.factory(factory_id, factory_name, factory_location, manager_name, contact_phone)
SELECT
    CONCAT('FAC', RIGHT('0000' + CAST(f.rn AS VARCHAR(4)), 4)),
    f.factory_name,
    f.factory_location,
    f.manager_name,
    CONCAT('1372000', RIGHT('0000' + CAST(f.rn AS VARCHAR(4)), 4))
FROM factories f;

;WITH product_pool AS (
    SELECT product_name, product_category
    FROM (VALUES
        (N'宫保鸡丁', N'小炒'), (N'鱼香肉丝', N'小炒'), (N'麻婆豆腐', N'小炒'), (N'回锅肉', N'小炒'),
        (N'水煮鱼', N'小炒'), (N'红烧排骨', N'小炒'), (N'糖醋里脊', N'小炒'), (N'干煸四季豆', N'小炒'),
        (N'蚂蚁上树', N'小炒'), (N'东坡肉', N'小炒'), (N'梅菜扣肉', N'小炒'), (N'白切鸡', N'小炒'),
        (N'口水鸡', N'小炒'), (N'辣子鸡', N'小炒'), (N'啤酒鸭', N'小炒'), (N'可乐鸡翅', N'小炒'),
        (N'蒜蓉西兰花', N'小炒'), (N'蚝油生菜', N'小炒'), (N'地三鲜', N'小炒'), (N'鱼香茄子', N'小炒'),
        (N'西红柿炒蛋', N'小炒'), (N'青椒土豆丝', N'小炒'), (N'酸辣土豆丝', N'小炒'), (N'木须肉', N'小炒'),
        (N'京酱肉丝', N'小炒'), (N'葱爆羊肉', N'小炒'), (N'孜然羊肉', N'小炒'), (N'黑椒牛柳', N'小炒'),
        (N'小炒黄牛肉', N'小炒'), (N'酸汤肥牛', N'汤羹'), (N'毛血旺', N'小炒'), (N'夫妻肺片', N'小吃'),
        (N'凉拌黄瓜', N'小吃'), (N'口水鸭血', N'小吃'), (N'酸菜鱼', N'汤羹'), (N'剁椒鱼头', N'小炒'),
        (N'清蒸鲈鱼', N'小炒'), (N'红烧狮子头', N'小炒'), (N'四喜丸子', N'小炒'), (N'粉蒸肉', N'小炒'),
        (N'梅干菜烧肉', N'小炒'), (N'黄焖鸡', N'盖饭'), (N'大盘鸡', N'小炒'), (N'手撕包菜', N'小炒'),
        (N'干锅花菜', N'小炒'), (N'清炒时蔬', N'小炒'), (N'上汤娃娃菜', N'汤羹'), (N'蒜蓉粉丝蒸虾', N'小炒'),
        (N'白灼虾', N'小炒'), (N'避风塘炒蟹', N'小炒'), (N'扬州炒饭', N'盖饭'), (N'蛋炒饭', N'盖饭'),
        (N'牛肉盖饭', N'盖饭'), (N'照烧鸡腿盖饭', N'盖饭'), (N'卤肉饭', N'盖饭'), (N'台式三杯鸡', N'小炒'),
        (N'台湾卤肉饭', N'盖饭'), (N'担担面', N'面食'), (N'重庆小面', N'面食'), (N'酸菜牛肉面', N'面食'),
        (N'红烧牛肉面', N'面食'), (N'番茄鸡蛋面', N'面食'), (N'葱油拌面', N'面食'), (N'炸酱面', N'面食'),
        (N'裤带面', N'面食'), (N'鲜肉馄饨', N'小吃'), (N'小笼包', N'小吃'), (N'猪肉煎饺', N'小吃'),
        (N'三鲜锅贴', N'小吃'), (N'春卷', N'小吃'), (N'炸春卷', N'小吃'), (N'糯米鸡', N'小吃'),
        (N'烧卖', N'小吃'), (N'肠粉', N'小吃'), (N'叉烧包', N'小吃'), (N'豆沙包', N'小吃'),
        (N'南瓜饼', N'小吃'), (N'芝麻球', N'小吃'), (N'红糖糍粑', N'小吃'), (N'老坛酸菜汤', N'汤羹'),
        (N'西湖牛肉羹', N'汤羹'), (N'紫菜蛋花汤', N'汤羹'), (N'冬瓜排骨汤', N'汤羹'),         (N'玉米排骨汤', N'汤羹')
    ) v(product_name, product_category)
),
products AS (
    SELECT TOP (80) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn,
           product_name, product_category
    FROM product_pool
)
INSERT INTO dbo.product(product_id, product_name, product_category, sales_price, shelf_life_days)
SELECT
    CONCAT('PRO', RIGHT('0000' + CAST(p.rn AS VARCHAR(4)), 4)),
    p.product_name,
    p.product_category,
    CAST(18 + (p.rn % 20) * 2.5 AS DECIMAL(12,2)),
    7 + (p.rn % 60)
FROM products p;

;WITH stores AS (
    SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn,
           store_name, store_address, store_manager
    FROM (VALUES
        (N'鲜食优选·朝阳店', N'北京市朝阳区建国路88号', N'张明'),
        (N'鲜食优选·海淀店', N'北京市海淀区中关村大街36号', N'李芳'),
        (N'快厨小站·西城店', N'北京市西城区西单北大街120号', N'王强'),
        (N'预制菜便民·东城店', N'北京市东城区王府井大街200号', N'刘静'),
        (N'味来坊·丰台店', N'北京市丰台区南三环西路16号', N'陈磊'),
        (N'绿鲜铺·石景山店', N'北京市石景山区石景山路18号', N'赵敏'),
        (N'食尚快购·通州店', N'北京市通州区新华西街58号', N'杨波'),
        (N'鲜达便利·昌平店', N'北京市昌平区回龙观东大街6号', N'周丽'),
        (N'优选厨房·大兴店', N'北京市大兴区黄村镇兴华大街', N'吴军'),
        (N'速享鲜厨·顺义店', N'北京市顺义区府前街9号', N'徐娜'),
        (N'鲜食优选·浦东店', N'上海市浦东新区陆家嘴环路1000号', N'孙伟'),
        (N'快厨小站·徐汇店', N'上海市徐汇区漕溪北路88号', N'马琳'),
        (N'味来坊·静安店', N'上海市静安区南京西路1266号', N'朱峰'),
        (N'绿鲜铺·杨浦店', N'上海市杨浦区五角场万达广场', N'胡婷'),
        (N'食尚快购·天河店', N'广州市天河区天河路228号', N'郭亮'),
        (N'鲜达便利·越秀店', N'广州市越秀区北京路168号', N'何雪'),
        (N'优选厨房·南山店', N'深圳市南山区科技园南区', N'高峰'),
        (N'速享鲜厨·福田店', N'深圳市福田区深南大道6008号', N'林娟'),
        (N'鲜食优选·武侯店', N'成都市武侯区人民南路四段', N'罗斌'),
        (N'快厨小站·锦江店', N'成都市锦江区春熙路99号', N'梁燕'),
        (N'味来坊·江汉店', N'武汉市江汉区解放大道688号', N'宋杰'),
        (N'绿鲜铺·洪山店', N'武汉市洪山区珞喻路461号', N'唐敏'),
        (N'食尚快购·西湖店', N'杭州市西湖区文三路478号', N'冯刚'),
        (N'鲜达便利·滨江店', N'杭州市滨江区江南大道588号', N'邓丽'),
        (N'优选厨房·鼓楼店', N'南京市鼓楼区中山北路45号', N'曹勇'),
        (N'速享鲜厨·建邺店', N'南京市建邺区江东中路98号', N'彭静'),
        (N'鲜食优选·雁塔店', N'西安市雁塔区小寨东路8号', N'董浩'),
        (N'快厨小站·碑林店', N'西安市碑林区南大街30号', N'袁梅'),
        (N'味来坊·渝中店', N'重庆市渝中区解放碑步行街', N'蒋涛'),
        (N'绿鲜铺·江北店', N'重庆市江北区观音桥步行街', N'韩冰'),
        (N'食尚快购·和平店', N'天津市和平区南京路219号', N'谢芳'),
        (N'鲜达便利·河西店', N'天津市河西区友谊路35号', N'潘强'),
        (N'优选厨房·姑苏店', N'苏州市姑苏区观前街1号', N'杜娟'),
        (N'速享鲜厨·工业园店', N'苏州市工业园区星湖街328号', N'程伟'),
        (N'鲜食优选·岳麓店', N'长沙市岳麓区麓山南路932号', N'吕娜'),
        (N'快厨小站·芙蓉店', N'长沙市芙蓉区五一大道800号', N'丁磊'),
        (N'味来坊·金水店', N'郑州市金水区花园路39号', N'任静'),
        (N'绿鲜铺·二七店', N'郑州市二七区大学路18号', N'沈强'),
        (N'食尚快购·历下店', N'济南市历下区泉城路180号', N'姚丽'),
        (N'鲜达便利·市南店', N'青岛市市南区香港中路76号', N'谭军')
    ) v(store_name, store_address, store_manager)
)
INSERT INTO dbo.store(store_id, store_name, store_address, store_manager, contact_phone)
SELECT
    CONCAT('STO', RIGHT('0000' + CAST(s.rn AS VARCHAR(4)), 4)),
    s.store_name,
    s.store_address,
    s.store_manager,
    CONCAT('1363000', RIGHT('0000' + CAST(s.rn AS VARCHAR(4)), 4))
FROM stores s;

/* Seed data: recipe and production */
;WITH product_pool AS (
    SELECT product_name
    FROM (VALUES
        (N'宫保鸡丁'), (N'鱼香肉丝'), (N'麻婆豆腐'), (N'回锅肉'), (N'水煮鱼'), (N'红烧排骨'), (N'糖醋里脊'), (N'干煸四季豆'),
        (N'蚂蚁上树'), (N'东坡肉'), (N'梅菜扣肉'), (N'白切鸡'), (N'口水鸡'), (N'辣子鸡'), (N'啤酒鸭'), (N'可乐鸡翅'),
        (N'蒜蓉西兰花'), (N'蚝油生菜'), (N'地三鲜'), (N'鱼香茄子'), (N'西红柿炒蛋'), (N'青椒土豆丝'), (N'酸辣土豆丝'), (N'木须肉'),
        (N'京酱肉丝'), (N'葱爆羊肉'), (N'孜然羊肉'), (N'黑椒牛柳'), (N'小炒黄牛肉'), (N'酸汤肥牛'), (N'毛血旺'), (N'夫妻肺片'),
        (N'凉拌黄瓜'), (N'口水鸭血'), (N'酸菜鱼'), (N'剁椒鱼头'), (N'清蒸鲈鱼'), (N'红烧狮子头'), (N'四喜丸子'), (N'粉蒸肉'),
        (N'梅干菜烧肉'), (N'黄焖鸡'), (N'大盘鸡'), (N'手撕包菜'), (N'干锅花菜'), (N'清炒时蔬'), (N'上汤娃娃菜'), (N'蒜蓉粉丝蒸虾'),
        (N'白灼虾'), (N'避风塘炒蟹'), (N'扬州炒饭'), (N'蛋炒饭'), (N'牛肉盖饭'), (N'照烧鸡腿盖饭'), (N'卤肉饭'), (N'台式三杯鸡'),
        (N'台湾卤肉饭'), (N'担担面'), (N'重庆小面'), (N'酸菜牛肉面'), (N'红烧牛肉面'), (N'番茄鸡蛋面'), (N'葱油拌面'), (N'炸酱面'),
        (N'裤带面'), (N'鲜肉馄饨'), (N'小笼包'), (N'猪肉煎饺'), (N'三鲜锅贴'), (N'春卷'), (N'炸春卷'), (N'糯米鸡'),
        (N'烧卖'), (N'肠粉'), (N'叉烧包'), (N'豆沙包'), (N'南瓜饼'), (N'芝麻球'), (N'红糖糍粑'), (N'老坛酸菜汤'),
        (N'西湖牛肉羹'), (N'紫菜蛋花汤'), (N'冬瓜排骨汤'),         (N'玉米排骨汤')
    ) v(product_name)
),
products AS (
    SELECT TOP (80) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn, product_name
    FROM product_pool
)
INSERT INTO dbo.recipe(recipe_id, product_id, recipe_name, recipe_version)
SELECT
    CONCAT('REC', RIGHT('0000' + CAST(p.rn AS VARCHAR(4)), 4)),
    CONCAT('PRO', RIGHT('0000' + CAST(p.rn AS VARCHAR(4)), 4)),
    CONCAT(p.product_name, N'标准配方'),
    'v1.0'
FROM products p;

;WITH r AS (
    SELECT TOP (80) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS recipe_no
    FROM sys.all_objects
),
line_no AS (
    SELECT v.line_no
    FROM (VALUES (1),(2),(3),(4)) v(line_no)
)
INSERT INTO dbo.recipe_ingredient(recipe_id, ingredient_id, ingredient_qty)
SELECT
    CONCAT('REC', RIGHT('0000' + CAST(r.recipe_no AS VARCHAR(4)), 4)),
    CONCAT('ING', RIGHT('0000' + CAST((((r.recipe_no * 5 + line_no.line_no * 7) - 1) % 120) + 1 AS VARCHAR(4)), 4)),
    CAST(0.5 + (line_no.line_no * 0.35) + ((r.recipe_no % 7) * 0.1) AS DECIMAL(12,2))
FROM r
CROSS JOIN line_no;

;WITH n AS (
    SELECT TOP (500) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
)
INSERT INTO dbo.work_order(work_order_id, factory_id, product_id, recipe_id, production_date, production_qty)
SELECT
    CONCAT('WO', RIGHT('000000' + CAST(rn AS VARCHAR(6)), 6)),
    CONCAT('FAC', RIGHT('0000' + CAST(((rn - 1) % 6) + 1 AS VARCHAR(4)), 4)),
    CONCAT('PRO', RIGHT('0000' + CAST(((rn * 3 - 1) % 80) + 1 AS VARCHAR(4)), 4)),
    CONCAT('REC', RIGHT('0000' + CAST(((rn * 3 - 1) % 80) + 1 AS VARCHAR(4)), 4)),
    DATEADD(DAY, -((rn % 365) + 1), CAST(GETDATE() AS DATE)),
    CAST(80 + (rn % 220) AS DECIMAL(12,2))
FROM n;

/* Seed data: procurement */
;WITH n AS (
    SELECT TOP (300) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
)
INSERT INTO dbo.purchase_order(purchase_order_id, supplier_id, order_date, order_total_amount, order_status)
SELECT
    CONCAT('PO', RIGHT('000000' + CAST(rn AS VARCHAR(6)), 6)),
    CONCAT('SUP', RIGHT('0000' + CAST(((rn - 1) % 30) + 1 AS VARCHAR(4)), 4)),
    DATEADD(DAY, -CASE WHEN rn % 10 IN (0, 1, 2, 3) THEN rn % 21 ELSE rn % 300 END, CAST(GETDATE() AS DATE)),
    0,
    CASE WHEN rn % 10 IN (0, 1, 2, 3) THEN 'PENDING'
         WHEN rn % 10 IN (4, 5, 6) THEN 'APPROVED'
         WHEN rn % 10 = 7 THEN 'CANCELLED'
         ELSE 'COMPLETED' END
FROM n;

;WITH o AS (
    SELECT TOP (300) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS order_no
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
),
line_no AS (
    SELECT v.line_no FROM (VALUES (1),(2),(3)) v(line_no)
)
INSERT INTO dbo.purchase_detail(purchase_detail_id, purchase_order_id, ingredient_id, purchase_qty, purchase_unit_price)
SELECT
    CONCAT('POD', RIGHT('000000' + CAST(((o.order_no - 1) * 3 + line_no.line_no) AS VARCHAR(6)), 6)),
    CONCAT('PO', RIGHT('000000' + CAST(o.order_no AS VARCHAR(6)), 6)),
    CONCAT('ING', RIGHT('0000' + CAST((((o.order_no * 13 + line_no.line_no * 11) - 1) % 120) + 1 AS VARCHAR(4)), 4)),
    CAST(8 + ((o.order_no + line_no.line_no) % 35) AS DECIMAL(12,2)),
    CAST(1.8 + ((o.order_no * line_no.line_no) % 10) * 0.55 AS DECIMAL(12,2))
FROM o
CROSS JOIN line_no;

UPDATE po
SET po.order_total_amount = d.total_amt
FROM dbo.purchase_order po
JOIN (
    SELECT purchase_order_id, SUM(purchase_qty * purchase_unit_price) AS total_amt
    FROM dbo.purchase_detail
    GROUP BY purchase_order_id
) d ON d.purchase_order_id = po.purchase_order_id;

/* Seed data: warehouse and transfe */
;WITH n AS (
    SELECT TOP (500) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
)
INSERT INTO dbo.inventory(inventory_id, warehouse_id, ingredient_id, stock_qty, production_date, expiry_date, safety_stock)
SELECT
    CONCAT('INV', RIGHT('000000' + CAST(rn AS VARCHAR(6)), 6)),
    CONCAT('WAR', RIGHT('0000' + CAST(((rn - 1) % 8) + 1 AS VARCHAR(4)), 4)),
    CONCAT('ING', RIGHT('0000' + CAST(((rn * 7 - 1) % 120) + 1 AS VARCHAR(4)), 4)),
    CAST(40 + (rn % 600) AS DECIMAL(12,2)),
    DATEADD(DAY, -(rn % 120), CAST(GETDATE() AS DATE)),
    DATEADD(DAY, 20 + (rn % 220), CAST(GETDATE() AS DATE)),
    CAST(15 + (rn % 50) AS DECIMAL(12,2))
FROM n;

;WITH n AS (
    SELECT TOP (180) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
)
INSERT INTO dbo.transfer_order(transfer_order_id, source_warehouse_id, target_warehouse_id, transfer_date, transfer_type)
SELECT
    CONCAT('TO', RIGHT('000000' + CAST(rn AS VARCHAR(6)), 6)),
    CONCAT('WAR', RIGHT('0000' + CAST(((rn - 1) % 8) + 1 AS VARCHAR(4)), 4)),
    CONCAT('WAR', RIGHT('0000' + CAST(((rn + 3) % 8) + 1 AS VARCHAR(4)), 4)),
    DATEADD(DAY, -(rn % 180), CAST(GETDATE() AS DATE)),
    CASE WHEN rn % 3 = 0 THEN 'BALANCE'
         WHEN rn % 3 = 1 THEN 'EMERGENCY'
         ELSE 'REPLENISH' END
FROM n;

;WITH o AS (
    SELECT TOP (180) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS order_no
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
),
line_no AS (
    SELECT v.line_no FROM (VALUES (1),(2)) v(line_no)
)
INSERT INTO dbo.transfer_detail(transfer_detail_id, transfer_order_id, ingredient_id, transfer_qty)
SELECT
    CONCAT('TOD', RIGHT('000000' + CAST(((o.order_no - 1) * 2 + line_no.line_no) AS VARCHAR(6)), 6)),
    CONCAT('TO', RIGHT('000000' + CAST(o.order_no AS VARCHAR(6)), 6)),
    CONCAT('ING', RIGHT('0000' + CAST((((o.order_no * 9 + line_no.line_no * 5) - 1) % 120) + 1 AS VARCHAR(4)), 4)),
    CAST(5 + ((o.order_no + line_no.line_no) % 90) AS DECIMAL(12,2))
FROM o
CROSS JOIN line_no;

/* Seed data: sales */
;WITH n AS (
    SELECT TOP (450) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS rn
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
)
INSERT INTO dbo.sales_order(sales_order_id, store_id, order_date, order_total_amount, order_status)
SELECT
    CONCAT('SO', RIGHT('000000' + CAST(rn AS VARCHAR(6)), 6)),
    CONCAT('STO', RIGHT('0000' + CAST(((rn - 1) % 40) + 1 AS VARCHAR(4)), 4)),
    DATEADD(DAY, -CASE WHEN rn % 20 IN (0, 1, 2, 3, 4, 5, 6) THEN rn % 14 ELSE rn % 150 END, CAST(GETDATE() AS DATE)),
    0,
    CASE WHEN rn % 20 IN (0, 1, 2, 3, 4, 5, 6) THEN 'PENDING'
         WHEN rn % 20 IN (7, 8, 9, 10, 11) THEN 'PAID'
         WHEN rn % 20 IN (12, 13, 14, 15) THEN 'SHIPPED'
         WHEN rn % 20 = 16 THEN 'CANCELLED'
         ELSE 'COMPLETED' END
FROM n;

;WITH o AS (
    SELECT TOP (450) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS order_no
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
),
line_no AS (
    SELECT v.line_no FROM (VALUES (1),(2),(3),(4)) v(line_no)
)
INSERT INTO dbo.sales_detail(sales_detail_id, sales_order_id, product_id, sales_qty, sales_unit_price)
SELECT
    CONCAT('SOD', RIGHT('000000' + CAST(((o.order_no - 1) * 4 + line_no.line_no) AS VARCHAR(6)), 6)),
    CONCAT('SO', RIGHT('000000' + CAST(o.order_no AS VARCHAR(6)), 6)),
    CONCAT('PRO', RIGHT('0000' + CAST((((o.order_no * 17 + line_no.line_no * 13) - 1) % 80) + 1 AS VARCHAR(4)), 4)),
    CAST(2 + ((o.order_no + line_no.line_no) % 14) AS DECIMAL(12,2)),
    CAST(32 + (((o.order_no * 2) + line_no.line_no) % 28) * 2.8 AS DECIMAL(12,2))
FROM o
CROSS JOIN line_no
WHERE line_no.line_no <= 2 + (o.order_no % 3);

UPDATE so
SET so.order_total_amount = d.total_amt
FROM dbo.sales_order so
JOIN (
    SELECT sales_order_id, SUM(sales_qty * sales_unit_price) AS total_amt
    FROM dbo.sales_detail
    GROUP BY sales_order_id
) d ON d.sales_order_id = so.sales_order_id;

/* Validation queries */
SELECT 'sys_role' AS table_name, COUNT(*) AS row_count FROM dbo.sys_role
UNION ALL SELECT 'sys_user', COUNT(*) FROM dbo.sys_user
UNION ALL SELECT 'supplier', COUNT(*) FROM dbo.supplier
UNION ALL SELECT 'ingredient', COUNT(*) FROM dbo.ingredient
UNION ALL SELECT 'purchase_order', COUNT(*) FROM dbo.purchase_order
UNION ALL SELECT 'purchase_detail', COUNT(*) FROM dbo.purchase_detail
UNION ALL SELECT 'warehouse', COUNT(*) FROM dbo.warehouse
UNION ALL SELECT 'inventory', COUNT(*) FROM dbo.inventory
UNION ALL SELECT 'transfer_order', COUNT(*) FROM dbo.transfer_order
UNION ALL SELECT 'transfer_detail', COUNT(*) FROM dbo.transfer_detail
UNION ALL SELECT 'factory', COUNT(*) FROM dbo.factory
UNION ALL SELECT 'product', COUNT(*) FROM dbo.product
UNION ALL SELECT 'recipe', COUNT(*) FROM dbo.recipe
UNION ALL SELECT 'recipe_ingredient', COUNT(*) FROM dbo.recipe_ingredient
UNION ALL SELECT 'work_order', COUNT(*) FROM dbo.work_order
UNION ALL SELECT 'store', COUNT(*) FROM dbo.store
UNION ALL SELECT 'sales_order', COUNT(*) FROM dbo.sales_order
UNION ALL SELECT 'sales_detail', COUNT(*) FROM dbo.sales_detail;

SELECT
    (SELECT COUNT(*) FROM dbo.sys_role) +
    (SELECT COUNT(*) FROM dbo.sys_user) +
    (SELECT COUNT(*) FROM dbo.supplier) +
    (SELECT COUNT(*) FROM dbo.ingredient) +
    (SELECT COUNT(*) FROM dbo.purchase_order) +
    (SELECT COUNT(*) FROM dbo.purchase_detail) +
    (SELECT COUNT(*) FROM dbo.warehouse) +
    (SELECT COUNT(*) FROM dbo.inventory) +
    (SELECT COUNT(*) FROM dbo.transfer_order) +
    (SELECT COUNT(*) FROM dbo.transfer_detail) +
    (SELECT COUNT(*) FROM dbo.factory) +
    (SELECT COUNT(*) FROM dbo.product) +
    (SELECT COUNT(*) FROM dbo.recipe) +
    (SELECT COUNT(*) FROM dbo.recipe_ingredient) +
    (SELECT COUNT(*) FROM dbo.work_order) +
    (SELECT COUNT(*) FROM dbo.store) +
    (SELECT COUNT(*) FROM dbo.sales_order) +
    (SELECT COUNT(*) FROM dbo.sales_detail) AS total_tuple_count;

-- orphan checks (should return 0)
SELECT COUNT(*) AS orphan_purchase_detail
FROM dbo.purchase_detail d
LEFT JOIN dbo.purchase_order o ON o.purchase_order_id = d.purchase_order_id
WHERE o.purchase_order_id IS NULL;

SELECT COUNT(*) AS orphan_sales_detail
FROM dbo.sales_detail d
LEFT JOIN dbo.sales_order o ON o.sales_order_id = d.sales_order_id
WHERE o.sales_order_id IS NULL;

-- business sanity checks
SELECT
    (SELECT SUM(order_total_amount) FROM dbo.purchase_order) AS purchase_total,
    (SELECT SUM(order_total_amount) FROM dbo.sales_order) AS sales_total,
    CAST(
        (SELECT SUM(order_total_amount) FROM dbo.purchase_order) * 100.0
        / NULLIF((SELECT SUM(order_total_amount) FROM dbo.sales_order), 0)
        AS DECIMAL(12,2)
    ) AS purchase_to_sales_pct;

SELECT order_status, COUNT(*) AS order_count
FROM dbo.purchase_order
GROUP BY order_status
ORDER BY order_status;

SELECT order_status, COUNT(*) AS order_count
FROM dbo.sales_order
GROUP BY order_status
ORDER BY order_status;
