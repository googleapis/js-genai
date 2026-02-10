## No optional dependencies test package

The purpose of this package is to confirm that projects that depend on `@google/genai` and
no other dependencies (specifically, not on any of our optional depenendencies) can properly build.

Note that running this in-place does not properly simulate the use case as some of the modules installed from the repositories
root `package.json` may be used.


The `test/packaging/test_packaging.sh` test simulates using a packaged version of `@google/genai` with this simple project extracted to a separate folder.


