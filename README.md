# Structuro - VS Code Extension

**Structuro** is a Visual Studio Code extension that allows you to **copy the structure and content of files** directly to the **clipboard**. You can use it via a **right-click** on a file or folder in the file explorer, or with a **keyboard shortcut** to capture all open files in tabs.

## Features

### 1. Copy the structure of a file or folder
With Structuro, you can quickly copy the structure and content of a file or folder directly to the **clipboard**. This option is available via a **right-click** on any file or folder in the VS Code file explorer.

- **Folder structure**: All subfolders and files are displayed with a clear hierarchy.
- **File content**: The content of each file is included, limited to 1000 characters to avoid copying large files.
- **Filters**: Hidden or configuration folders (those starting with `.` or `__`), as well as multimedia files (like `.mp3`, `.mp4`, `.wav`, `.png`, etc.), are automatically excluded to avoid clutter.

#### How to use:
1. Open the file explorer in VS Code.
2. Right-click on a file or folder.
3. Select **"Copy File/Folder Structure"**.
4. The structure and content will automatically be copied to your **clipboard**.

---

### 2. Copy the structure of open files in tabs
With a simple keyboard shortcut, you can copy the structure and content of **all open files in the tabs** of VS Code. Structuro scans all open tabs, retrieves the structure and content of the files, and copies everything to the clipboard.

#### How to use:
1. Open multiple files in tabs in VS Code.
2. Press **`Ctrl + Alt + S`**.
3. The structure and content of the open files will be copied to the **clipboard**.

---

## Technical Details
- **Ignored file types**: Multimedia files with extensions like `.mp3`, `.mp4`, `.wav`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.avi`, `.mov`, `.mkv`, etc., are excluded.
- **Ignored folders**: Hidden or configuration folders starting with `.` or `__` are not included in the copied structure.

## Use Cases
- **Quick project structure sharing**: Easily copy the structure of a project to share with an assistant like ChatGPT, colleagues, or for reports.
- **Documentation**: Use Structuro to quickly generate documentation for your project without manually writing the structure.
- **Project analysis**: Get a quick overview of your project’s file structure, along with snippets of file content.


## License

This extension is licensed under the MIT License. Feel free to modify and use it in your projects.

## Contact

Linkedin -> https://www.linkedin.com/in/thomas-gossin/