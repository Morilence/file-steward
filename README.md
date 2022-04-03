# File Steward

Easier file management interface for nodejs.

## Quick Start

```cmd
npm i file-steward -S
```

## Usage

```js
const FileSteward = require("file-steward");
/* The constructor must be given an absolute path as the root directory to manage. */
const steward = new FileSteward(require("path").resolve(__dirname, "resource"));
```

Each created steward will strictly manage file operations in the root directory and only in the root directory.

### Methods

#### createDirSync(path[, options])

+ path&ensp;[\<string\>][string_link]
+ options&ensp;[\<object\>][object_link]
  + recursive&ensp;[\<boolean\>][boolean_link]&ensp;default: true
+ **return**&ensp;[\<undefined\>][undefined_link]

Create a directory synchronously (if the directory already exists, nothing will be done).

#### createDir(path[, options])

+ path&ensp;[\<string\>][string_link]
+ options&ensp;[\<object\>][object_link]
  + recursive&ensp;[\<boolean\>][boolean_link]&ensp;default: true
+ **return**&ensp;[\<promise\>][promise_link]&ensp;Promise { undefined }

Create a directory asynchronously (if the directory already exists, nothing will be done).

#### createFileSync(path, data[, options])

+ path&ensp;[\<string\>][string_link]
+ data&ensp;[\<string\>][string_link] | [\<buffer\>][buffer_link]
+ options&ensp;[\<object\>][object_link]
  + cover&ensp;[\<boolean\>][boolean_link]&ensp;default: true
+ **return**&ensp;[\<undefined\>][undefined_link]

Create a file synchronously.

#### createFile(path, data[, options])

+ path&ensp;[\<string\>][string_link]
+ data&ensp;[\<string\>][string_link] | [\<buffer\>][buffer_link] | [\<fs.ReadStream\>][fsReadStream_link]
+ options&ensp;[\<object\>][object_link]
  + cover&ensp;[\<boolean\>][boolean_link]&ensp;default: true
+ **return**&ensp;[\<promise\>][promise_link]&ensp;Promise { undefined }

Create a file asynchronously (supports receiving a fs.ReadStream as the data).

#### copySync(srcPath, destPath)

+ srcPath&ensp;[\<string\>][string_link]
+ destPath&ensp;[\<string\>][string_link]
+ **return**&ensp;[\<undefined\>][undefined_link]

Copy a file/directory from it's source path to the destination path synchronously.

#### copy(srcPath, destPath[, options])

+ srcPath&ensp;[\<string\>][string_link]
+ destPath&ensp;[\<string\>][string_link]
+ options&ensp;[\<object\>][object_link]
  + stream&ensp;[\<boolean\>][boolean_link]&ensp;default: true
+ **return**&ensp;[\<promise\>][promise_link]&ensp;Promise { undefined }

Copy a file/directory from it's source path to the destination path asynchronously (supports stream mode).

#### removeSync(path[, options])

+ path&ensp;[\<string\>][string_link]
+ options&ensp;[\<object\>][object_link]
  + force&ensp;[\<boolean\>][boolean_link]&ensp;default: true
+ **return**&ensp;[\<undefined\>][undefined_link]

Remove the file/directory synchronously.

#### remove(path[, options])

+ path&ensp;[\<string\>][string_link]
+ options&ensp;[\<object\>][object_link]
  + force&ensp;[\<boolean\>][boolean_link]&ensp;default: true
+ **return**&ensp;[\<promise\>][promise_link]&ensp;Promise { undefined }

Remove the file/directory asynchronously.

#### cutSync(srcPath, destPath)

+ srcPath&ensp;[\<string\>][string_link]
+ destPath&ensp;[\<string\>][string_link]
+ **return**&ensp;[\<undefined\>][undefined_link]

Cut a file/directory from it's source path to the destination path synchronously.

#### cut(srcPath, destPath[, options])

+ srcPath&ensp;[\<string\>][string_link]
+ destPath&ensp;[\<string\>][string_link]
+ options&ensp;[\<object\>][object_link]
  + stream&ensp;[\<boolean\>][boolean_link]&ensp;default: true
+ **return**&ensp;[\<promise\>][promise_link]&ensp;Promise { undefined }

Cut a file/directory from it's source path to the destination path asynchronously (supports stream mode).

#### renameSync(oldPath, newPath)

+ oldPath&ensp;[\<string\>][string_link]
+ newPath&ensp;[\<string\>][string_link]
+ **return**&ensp;[\<undefined\>][undefined_link]

Rename a file/directory synchronously.

#### rename(oldPath, newPath)

+ oldPath&ensp;[\<string\>][string_link]
+ newPath&ensp;[\<string\>][string_link]
+ **return**&ensp;[\<promise\>][promise_link]&ensp;Promise { undefined }

Rename a file/directory asynchronously.

#### bulkSync(list)

+ list&ensp;[\<object[]\>][object_link]
  + op&ensp;[\<integer\>][number_link]&ensp;(refer from [FileSteward.OP](#filestewardop))
  + [, type]&ensp;[\<integer\>][number_link]&ensp;(refer from [FileSteward.TYPE](#filestewardtype))
  + [, path]&ensp;[\<string\>][string_link]
  + [, data]&ensp;[\<string\>][string_link] | [\<buffer\>][buffer_link]
  + [, srcPath]&ensp;[\<string\>][string_link]
  + [, destPath]&ensp;[\<string\>][string_link]
  + [, oldPath]&ensp;[\<string\>][string_link]
  + [, newPath]&ensp;[\<string\>][string_link]
  + [, options]&ensp;[\<object\>][object_link]&ensp;specific attributes are determined by "op"
+ **return**&ensp;[\<undefined\>][undefined_link]

Bulk operations in order synchronously.

**example:**

```js
steward.bulkSync([
    { op: FileSteward.OP.CREATE, type: FileSteward.TYPE.DIRECTORY, path: "texts" },
    { op: FileSteward.OP.CREATE, type: FileSteward.TYPE.FILE, path: "texts/hello.txt", data: "Hello world!" },
    { op: FileSteward.OP.COPY, srcPath: "texts/hello.txt", destPath: "texts/hello_copy.txt" },
    { op: FileSteward.OP.RENAME, oldPath: "texts/hello_copy.txt", newPath: "texts/hello_backup.txt" },
]);
```

#### bulk(list)

+ list&ensp;[\<object[]\>][object_link]
  + op&ensp;[\<integer\>][number_link]&ensp;(refer from [FileSteward.OP](#filestewardop))
  + [, type]&ensp;[\<integer\>][number_link]&ensp;(refer from [FileSteward.TYPE](#filestewardtype))
  + [, path]&ensp;[\<string\>][string_link]
  + [, data]&ensp;[\<string\>][string_link] | [\<buffer\>][buffer_link]
  + [, srcPath]&ensp;[\<string\>][string_link]
  + [, destPath]&ensp;[\<string\>][string_link]
  + [, oldPath]&ensp;[\<string\>][string_link]
  + [, newPath]&ensp;[\<string\>][string_link]
  + [, options]&ensp;[\<object\>][object_link]&ensp;specific attributes are determined by "op"
+ **return**&ensp;[\<promise\>][promise_link]&ensp;Promise { undefined }

Bulk operations in order asynchronously.

#### check(path[, options])

+ path&ensp;[\<string\>][string_link]
+ options&ensp;[\<object\>][object_link]
  + relative&ensp;[\<boolean\>][boolean_link]&ensp;default: true
  + children&ensp;[\<boolean\>][boolean_link]&ensp;default: false
  + recursive&ensp;[\<boolean\>][boolean_link]&ensp;default: false
+ **return**&ensp;[\<promise\>][promise_link]&ensp;Promise { object }
  + path&ensp;[\<string\>][string_link]
  + type&ensp;[\<integer\>][number_link]&ensp;(refer from [FileSteward.TYPE](#filestewardtype))
  + stat&ensp;[\<fs.Stats\>][fsStats_link]

Get the information of the file/directory asynchronously.

#### isIncludeSync(path)

+ path&ensp;[\<string\>][string_link]
+ **return**&ensp;[\<boolean\>][boolean_link]

Whether the path is in the steward's jurisdiction.

#### isExistSync(path)

+ path&ensp;[\<string\>][string_link]
+ **return**&ensp;[\<boolean\>][boolean_link]

Whether the file/directory pointed by the path exists in the jurisdiction.

### Static Constants

#### FileSteward.TYPE

+ **BLOCK_DEVICE**&emsp;**0**
+ **CHARACTER_DEVICE**&emsp;**1**
+ **DIRECTORY**&emsp;**2**
+ **FIFO**&emsp;**3**
+ **FILE**&emsp;**4**
+ **SOCKET**&emsp;**5**
+ **SYMBOLIC_LINK**&emsp;**6**

#### FileSteward.OP

+ **CREATE**&emsp;**0**
+ **COPY**&emsp;**1**
+ **REMOVE**&emsp;**2**
+ **CUT**&emsp;**3**
+ **RENAME**&emsp;**4**

## License

File Steward is [MIT licensed](./LICENSE).

[number_link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#number_type
[string_link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#string_type
[undefined_link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#undefined_type
[boolean_link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#boolean_type
[object_link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[promise_link]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[buffer_link]: https://nodejs.org/dist/latest-v16.x/docs/api/buffer.html#buffer
[fsReadStream_link]: https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#class-fsreadstream
[fsStats_link]: https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#class-fsstats
