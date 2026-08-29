-- Custom SQL migration file, put your code below! --
UPDATE `user` SET `emailVerified` = 1 WHERE `emailVerified` = 0;