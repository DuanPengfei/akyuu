/**
 * Created by fei on 2017/03/29.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const async = require("async");

class Boot {
    constructor(akyuu) {
        this.akyuu = akyuu;
        this.logger = akyuu.logger.get("boot-loader");
        this.dir = path.resolve(akyuu.projectRoot, "boots");
        this.tasks = [];
    }

    _loadTasks(dir) {
        let tasks = [];
        let stat;

        try {
            stat = fs.statSync(dir);
        } catch(e) {
            this.logger.warn(`Can't load tasks: ${e.message}`, {
                path: dir,
                error: e
            });
            return tasks;
        }

        if(!stat.isDirectory()) {
            return tasks;
        } else {
            let files;
            try {
                files = fs.readdirSync(dir);
            } catch(e) {
                throw e;
            }

            for(let i = 0; i < files.length; i++) {
                const filePath = path.resolve(dir, files[i]);
                stat = fs.statSync(filePath);
                if(stat.isDirectory()) {
                    tasks = tasks.concat(this._loadTasks(filePath));
                } else {
                    if(!files[i].endsWith(".js")) continue;

                    tasks.push({
                        name: path.basename(files[i]),
                        path: filePath,
                        beforeInit: require(filePath).beforeInit,
                        function: require(filePath).boot
                    });
                }
            }

            return tasks;
        }
    }

    load(beforeInit, callback) {
        const self = this;
        let tasks;
        try {
            tasks = this._loadTasks(this.dir);
        } catch(error) {
            this.logger.error(error);
            return process.exit(1);
        }

        const results = [];
        async.eachLimit(tasks, 10, function(task, callback) {
            if(!!task.beforeInit !== beforeInit) return process.nextTick(function() { return callback(); });

            if(task.function.length > 1) {
                task.function(self.akyuu, function(error, result) {
                    if(error) {
                        return callback(error);
                    }
                    self.logger.info(`Boot task \`${task.name}\` run success.`);
                    if(result) results.push({ name: task.name, result: result });
                    return callback();
                });
            } else {
                try {
                    const result = task.function(self.akyuu);
                    self.logger.info(`Boot task \`${task.name}\` run success.`);
                    if(result) results.push({ name: task.name, result: result });
                    return process.nextTick(function() { return callback(null, result); });
                } catch(error) {
                    self.logger.error(`Boot task \`${task.name}\` run error.`);
                    return process.nextTick(function() { return callback(error); });
                }
            }
        }, function(error) {
            if(error) {
                self.logger.error(error);
                return callback(error);
            }

            return callback(null, results);
        });
    }
}

module.exports = Boot;
