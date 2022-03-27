const fs = require("fs");
const p = require("path");

module.exports = (function () {
    /* Error Type */
    class FileStewardError extends Error {
        constructor(msg) {
            super(msg);
            this.name = "FileStewardError";
        }
    }

    /* Assert */
    function _assert(condition, msg) {
        if (!condition) {
            throw new FileStewardError(msg);
        }
    }

    /* Internal Methods (All accept absolute path by default) */
    function _isExistSync(path) {
        try {
            fs.accessSync(path, fs.constants.F_OK);
            return true;
        } catch (err) {
            return false;
        }
    }

    function _statSync(path) {
        return fs.lstatSync(path);
    }

    function _isDirSync(path) {
        return _statSync(path).isDirectory();
    }

    function _isFileSync(path) {
        return _statSync(path).isFile();
    }

    async function _list(path, options = { relative: true, recursive: true }) {
        const list = [];
        for await (const dirent of await fs.promises.opendir(path)) {
            const obj = {
                path: options.relative
                    ? p.relative(this.root, p.resolve(path, dirent.name))
                    : p.resolve(path, dirent.name),
                stat: _statSync(p.resolve(path, dirent.name)),
                type: -1,
            };
            if (dirent.isBlockDevice()) {
                obj.type = 0;
            } else if (dirent.isCharacterDevice()) {
                obj.type = 1;
            } else if (dirent.isDirectory()) {
                obj.type = 2;
                if (options.recursive) {
                    obj.list = await _list.bind(this)(p.resolve(path, dirent.name), options);
                }
            } else if (dirent.isFIFO()) {
                obj.type = 3;
            } else if (dirent.isFile()) {
                obj.type = 4;
            } else if (dirent.isSocket()) {
                obj.type = 5;
            } else if (dirent.isSymbolicLink()) {
                obj.type = 6;
            }
            list.push(obj);
        }
        return list;
    }

    function _pipe(readStream, writeStream) {
        return new Promise(resolve => {
            readStream.pipe(writeStream);
            writeStream.on("close", () => {
                resolve(true);
            });
            writeStream.on("error", () => {
                resolve(false);
            });
        });
    }

    function _createDirSync(path, options = { recursive: true }) {
        try {
            fs.mkdirSync(path, { recursive: options.recursive });
            return true;
        } catch (err) {
            return false;
        }
    }

    async function _createDir(path, options = { recursive: true }) {
        try {
            await fs.promises.mkdir(path, { recursive: options.recursive });
            return true;
        } catch (err) {
            return false;
        }
    }

    function _createFileSync(path, data) {
        // synchronized methods do not support passing readStream
        if (_createDirSync(p.dirname(path))) {
            try {
                fs.writeFileSync(path, data);
                return true;
            } catch (err) {
                return false;
            }
        } else {
            false;
        }
    }

    async function _createFile(path, data) {
        if (await _createDir(p.dirname(path))) {
            if (data instanceof fs.ReadStream) {
                if (await _pipe(data, fs.createWriteStream(path))) {
                    return true;
                } else {
                    return false;
                }
            } else {
                try {
                    await fs.promises.writeFile(path, data);
                    return true;
                } catch (error) {
                    return false;
                }
            }
        } else {
            return false;
        }
    }

    function _copyFileSync(srcPath, destPath) {
        // cover by default
        try {
            fs.copyFileSync(srcPath, destPath, 0);
            return true;
        } catch (err) {
            return false;
        }
    }

    async function _copyFile(srcPath, destPath, options = { stream: true }) {
        // cover by default
        if (!options.stream) {
            try {
                await fs.promises.copyFile(srcPath, destPath, 0);
                return true;
            } catch (err) {
                return false;
            }
        } else {
            // implemented by stream
            return await _pipe(fs.createReadStream(srcPath), fs.createWriteStream(destPath));
        }
    }

    function _copyDirSync(srcPath, destPath) {
        try {
            fs.cpSync(srcPath, destPath, { recursive: true }); // This method can only be used with version 16.7.0 or later.
            return true;
        } catch (err) {
            return false;
        }
    }

    async function _copyDir(srcPath, destPath, options = { stream: true }) {
        try {
            if (await _createDir(destPath)) {
                for await (const dirent of await fs.promises.opendir(srcPath)) {
                    if (dirent.isDirectory()) {
                        await _copyDir(p.resolve(srcPath, dirent.name), p.resolve(destPath, dirent.name), options);
                    } else if (dirent.isFile()) {
                        await _copyFile(p.resolve(srcPath, dirent.name), p.resolve(destPath, dirent.name), options);
                    } else {
                        // Other file types are not currently supported.
                    }
                }
                return true;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }
    }

    function _removeFileSync(path) {
        try {
            fs.rmSync(path, { force: true });
            return true;
        } catch (err) {
            return false;
        }
    }

    async function _removeFile(path) {
        try {
            await fs.promises.rm(path, { force: true });
            return true;
        } catch (err) {
            return false;
        }
    }

    function _removeDirSync(path) {
        try {
            fs.rmSync(path, { recursive: true, force: true });
            return true;
        } catch (err) {
            return false;
        }
    }

    async function _removeDir(path) {
        try {
            await fs.promises.rm(path, { recursive: true, force: true });
            return true;
        } catch (err) {
            return false;
        }
    }

    return class FileSteward {
        constructor(path) {
            this.root = null;
            try {
                _assert(
                    path != undefined && p.isAbsolute(path),
                    "The constructor must be given an absolute path as the root to manage."
                );
                if (_isExistSync(path)) {
                    // files and symbolic links are not accepted
                    _assert(_isDirSync(path), `The path must point to a directory.`);
                } else {
                    // file/directory does not exist
                    _assert(_createDirSync(path), `The directory pointed by the path "${path}" create failed.`);
                }
                this.root = path;
            } catch (err) {
                switch (err.name) {
                    case "TypeError":
                        _assert(false, 'The "path" argument must be of type string.');
                        break;
                    default:
                        throw err;
                }
            }
        }

        /**
         * @param {String} path
         * @description Whether the path is in the steward's jurisdiction, and do not check for existence.
         */
        isIncludeSync(path) {
            try {
                path = p.resolve(this.root, path);
                return !(p.relative(this.root, path).length == 0 || p.relative(this.root, path).indexOf("..") == 0);
            } catch (err) {
                switch (err.name) {
                    case "TypeError":
                        _assert(false, 'The "path" argument must be of type string.');
                        break;
                    default:
                        throw err;
                }
            }
        }

        /**
         * @param {String} path
         * @description Whether the file pointed to by the path exists in the jurisdiction.
         */
        isExistSync(path) {
            path = p.resolve(this.root, path);
            _assert(this.isIncludeSync(path), `The path "${path}" is beyond the steward's jurisdiction.`);
            return _isExistSync(path);
        }

        /**
         * @param {String} path
         * @returns {Array|Object}
         * @description Browse the path asynchronously.
         */
        async browse(path = this.root, options = { relative: true, recursive: true }) {
            path = p.resolve(this.root, path);
            if (path == this.root) {
                return await _list.bind(this)(path, options);
            } else {
                _assert(this.isExistSync(path), `The file/directory pointed by the path "${path}" does not exist.`);
                if (_isDirSync(path)) {
                    return await _list.bind(this)(path, options);
                } else {
                    const obj = {
                        path,
                        stat: _statSync(path),
                        type: -1,
                    };
                    if (obj.stat.isBlockDevice()) {
                        obj.type = 0;
                    } else if (obj.stat.isCharacterDevice()) {
                        obj.type = 1;
                    } else if (obj.stat.isFIFO()) {
                        obj.type = 3;
                    } else if (obj.stat.isFile()) {
                        obj.type = 4;
                    } else if (obj.stat.isSocket()) {
                        obj.type = 5;
                    } else if (obj.stat.isSymbolicLink()) {
                        obj.type = 6;
                    }
                    return obj;
                }
            }
        }

        /**
         * @param {String} path
         * @param {Object} options
         * @description Create a directory synchronously (if the directory already exists, nothing will be done).
         */
        createDirSync(path, options = { recursive: true }) {
            path = p.resolve(this.root, path);
            _assert(this.isIncludeSync(path), `The path "${path}" is beyond the steward's jurisdiction.`);
            _assert(_createDirSync(path, options), `Failed to create the directory "${path}".`);
        }

        /**
         * @param {String} path
         * @param {Object} options
         * @description Create a directory asynchronously (if the directory already exists, nothing will be done).
         */
        async createDir(path, options = { recursive: true }) {
            path = p.resolve(this.root, path);
            _assert(this.isIncludeSync(path), `The path "${path}" is beyond the steward's jurisdiction.`);
            _assert(await _createDir(path, options), `Failed to create the directory "${path}".`);
        }

        /**
         * @param {String} path
         * @param {String|Buffer} data
         * @param {Object} options
         * @description Create a file synchronously.
         */
        createFileSync(path, data, options = { cover: true }) {
            path = p.resolve(this.root, path);
            _assert(this.isIncludeSync(path), `The path "${path}" is beyond the steward's jurisdiction.`);
            const isExist = _isExistSync(path);
            if (!isExist || (isExist && options.cover)) {
                _assert(_createFileSync(path, data), `Failed to create the file "${path}".`);
            } else if (isExist && !options.cover) {
                _assert(false, `The file pointed by the path "${path}" already exists.`);
            }
        }

        /**
         * @param {String} path
         * @param {String|Buffer|fs.ReadStream} data
         * @param {Object} options
         * @description Create a file asynchronously (supports passing a fs.ReadStream as the data).
         */
        async createFile(path, data, options = { cover: true }) {
            path = p.resolve(this.root, path);
            _assert(this.isIncludeSync(path), `The path "${path}" is beyond the steward's jurisdiction.`);
            const isExist = _isExistSync(path);
            if (!isExist || (isExist && options.cover)) {
                _assert(await _createFile(path, data), `Failed to create the file "${path}".`);
            } else if (isExist && !options.cover) {
                _assert(false, `The file pointed by the path "${path}" already exists.`);
            }
        }

        /**
         * @param {Array} list An array of task object which has path, type and options keys. When type is 2, it will create the directory; When type is 4, it needs one more key: data, then it will create the file.
         * @description Create in batches synchronously.
         */
        bulkCreateSync(list) {
            _assert(list instanceof Array, 'The "list" argument must be of type array.');
            for (let i = 0; i < list.length; i++) {
                _assert(list[i] instanceof Object, "The item in the list must be of type object.");
                const { path, type, data, options } = list[i];
                _assert(path != undefined, 'The "path" key in list\'s item must be given.');
                _assert(type != undefined, 'The "type" key in list\'s item must be given.');
                if (options != undefined) {
                    if (type == 2) {
                        // directory type
                        this.createDirSync(path, options);
                    } else if (type == 4) {
                        // file type
                        _assert(data != undefined, 'The "data" key in list\'s item must be given.');
                        this.createFileSync(path, data, options);
                    } else {
                        _assert(false, 'The value of "type" is unrecognized.');
                    }
                } else {
                    if (type == 2) {
                        // directory type
                        this.createDirSync(path);
                    } else if (type == 4) {
                        // file type
                        _assert(data != undefined, 'The "data" key in list\'s item must be given.');
                        this.createFileSync(path, data);
                    } else {
                        _assert(false, 'The value of "type" is unrecognized.');
                    }
                }
            }
        }

        /**
         * @param {Array} list An array of task object which has path, type and options keys. When type is 2, it will create the directory; When type is 4, it needs one more key: data, then it will create the file.
         * @description Create in batches asynchronously.
         */
        async bulkCreate(list) {
            _assert(list instanceof Array, 'The "list" argument must be of type array.');
            for (let i = 0; i < list.length; i++) {
                _assert(list[i] instanceof Object, "The item in the list must be of type object.");
                const { path, type, data, options } = list[i];
                _assert(path != undefined, 'The "path" key in list\'s item must be given.');
                _assert(type != undefined, 'The "type" key in list\'s item must be given.');
                if (options != undefined) {
                    if (type == 2) {
                        // directory type
                        await this.createDir(path, options);
                    } else if (type == 4) {
                        // file type
                        _assert(data != undefined, 'The "data" key in list\'s item must be given.');
                        await this.createFile(path, data, options);
                    } else {
                        _assert(false, 'The value of "type" is unrecognized.');
                    }
                } else {
                    if (type == 2) {
                        // directory type
                        await this.createDir(path);
                    } else if (type == 4) {
                        // file type
                        _assert(data != undefined, 'The "data" key in list\'s item must be given.');
                        await this.createFile(path, data);
                    } else {
                        _assert(false, 'The value of "type" is unrecognized.');
                    }
                }
            }
        }

        /**
         * @param {String} srcPath
         * @param {String} destPath
         * @description Copy a file/directory from it's source path to the destination path synchronously.
         */
        copySync(srcPath, destPath) {
            srcPath = p.resolve(this.root, srcPath);
            destPath = p.resolve(this.root, destPath);
            _assert(this.isExistSync(srcPath), `The file/directory pointed by the path "${srcPath}" does not exist.`);
            _assert(this.isIncludeSync(destPath), `The path "${destPath}" is beyond the steward's jurisdiction.`);
            if (_isDirSync(srcPath)) {
                _assert(destPath.indexOf(srcPath) == -1, `Can not copy ${srcPath} to a subdirectory of self.`);
                _assert(_copyDirSync(srcPath, destPath), `Failed to copy directory "${srcPath}" to "${destPath}".`);
            } else if (_isFileSync(srcPath)) {
                _assert(
                    _createDirSync(p.dirname(destPath)),
                    `Failed to create the parent directory "${p.dirname(destPath)}" of the path "${destPath}".`
                );
                _assert(_copyFileSync(srcPath, destPath), `Failed to copy file "${srcPath}" to "${destPath}".`);
            } else {
                _assert(false, "Other types are not currently supported.");
            }
        }

        /**
         * @param {String} srcPath
         * @param {String} destPath
         * @param {Object} options
         * @description Copy a file/directory from it's source path to the destination path asynchronously (supports using stream mode).
         */
        async copy(srcPath, destPath, options = { stream: true }) {
            srcPath = p.resolve(this.root, srcPath);
            destPath = p.resolve(this.root, destPath);
            _assert(this.isExistSync(srcPath), `The file/directory pointed by the path "${srcPath}" does not exist.`);
            _assert(this.isIncludeSync(destPath), `The path "${destPath}" is beyond the steward's jurisdiction.`);
            if (_isDirSync(srcPath)) {
                _assert(destPath.indexOf(srcPath) == -1, `Can not copy ${srcPath} to a subdirectory of self.`);
                _assert(
                    await _copyDir(srcPath, destPath, options),
                    `Failed to copy directory "${srcPath}" to "${destPath}".`
                );
            } else if (_isFileSync(srcPath)) {
                _assert(
                    await _createDir(p.dirname(destPath)),
                    `Failed to create the parent directory "${p.dirname(destPath)}" of the path "${destPath}".`
                );
                _assert(
                    await _copyFile(srcPath, destPath, options),
                    `Failed to copy file "${srcPath}" to "${destPath}".`
                );
            } else {
                _assert(false, "Other types are not currently supported.");
            }
        }

        /**
         * @param {Array} list An array of task object which has srcPath and destPath keys.
         * @description Copy in batches synchronously.
         */
        bulkCopySync(list) {
            _assert(list instanceof Array, 'The "list" argument must be of type array.');
            for (let i = 0; i < list.length; i++) {
                _assert(list[i] instanceof Object, "The item in the list must be of type object.");
                const { srcPath, destPath } = list[i];
                _assert(srcPath != undefined, 'The "srcPath" key in list\'s item must be given.');
                _assert(destPath != undefined, 'The "destPath" key in list\'s item must be given.');
                this.copySync(srcPath, destPath);
            }
        }

        /**
         * @param {Array} list An array of task object which has srcPath, destPath and options keys.
         * @description Copy in batches asynchronously.
         */
        async bulkCopy(list) {
            _assert(list instanceof Array, 'The "list" argument must be of type array.');
            for (let i = 0; i < list.length; i++) {
                _assert(list[i] instanceof Object, "The item in the list must be of type object.");
                const { srcPath, destPath, options } = list[i];
                _assert(srcPath != undefined, 'The "srcPath" key in list\'s item must be given.');
                _assert(destPath != undefined, 'The "destPath" key in list\'s item must be given.');
                if (options != undefined) {
                    await this.copy(srcPath, destPath, options);
                } else {
                    await this.copy(srcPath, destPath);
                }
            }
        }

        /**
         * @param {String} path
         * @description Remove the file/directory synchronously.
         */
        removeSync(path, options = { force: true }) {
            path = p.resolve(this.root, path);
            _assert(this.isIncludeSync(path), `The path "${path}" is beyond the steward's jurisdiction.`);
            if (_isExistSync(path)) {
                if (_isDirSync(path)) {
                    _removeDirSync(path);
                } else if (_isFileSync(path)) {
                    _removeFileSync(path);
                } else {
                    _assert(false, "Other types are not currently supported.");
                }
            } else {
                _assert(options.force, `The file/directory pointed by the path "${path}" does not exist already.`);
            }
        }

        /**
         * @param {String} path
         * @description Remove the file/directory asynchronously.
         */
        async remove(path, options = { force: true }) {
            path = p.resolve(this.root, path);
            _assert(this.isIncludeSync(path), `The path "${path}" is beyond the steward's jurisdiction.`);
            if (_isExistSync(path)) {
                if (_isDirSync(path)) {
                    await _removeDir(path);
                } else if (_isFileSync(path)) {
                    await _removeFile(path);
                } else {
                    _assert(false, "Other types are not currently supported.");
                }
            } else {
                _assert(options.force, `The file/directory pointed by the path "${path}" does not exist already.`);
            }
        }

        /**
         * @param {Array} list An array of task object which has path and options keys.
         * @description Remove in batches synchronously.
         */
        bulkRemoveSync(list) {
            _assert(list instanceof Array, 'The "list" argument must be of type array.');
            for (let i = 0; i < list.length; i++) {
                _assert(list[i] instanceof Object, "The item in the list must be of type object.");
                const { path, options } = list[i];
                _assert(path != undefined, 'The "path" key in list\'s item must be given.');
                if (options != undefined) {
                    this.removeSync(path, options);
                } else {
                    this.removeSync(path);
                }
            }
        }

        /**
         * @param {Array} list An array of task object which has path and options keys.
         * @description Remove in batches asynchronously.
         */
        async bulkRemove(list) {
            _assert(list instanceof Array, 'The "list" argument must be of type array.');
            for (let i = 0; i < list.length; i++) {
                _assert(list[i] instanceof Object, "The item in the list must be of type object.");
                const { path, options } = list[i];
                _assert(path != undefined, 'The "path" key in list\'s item must be given.');
                if (options != undefined) {
                    await this.remove(path, options);
                } else {
                    await this.remove(path);
                }
            }
        }
    };
})();
