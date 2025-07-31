load("//javascript/angular2:build_defs.bzl", "ng_module")
load("//testing/web/build_defs/js_test:js_test_environment.bzl", "js_test_environment")
load("//testing/web/build_defs/js_test:js_test_suite.bzl", "js_test_suite")
load("//third_party/bazel_rules/rules_sass/sass:sass.bzl", "sass_binary")

licenses(["notice"])

package(
    default_applicable_licenses = ["//third_party/javascript/google_genai:package_license"],
    default_visibility = [
        "//third_party/javascript/google_genai:__subpackages__",
    ],
)

sass_binary(
    name = "generate_content_css",
    src = "generate_content.scss",
    sourcemap = False,
)

ng_module(
    name = "generate_content_tests",
    testonly = True,
    srcs = ["generate_content_test.ts"],
    deps = [
        ":generate_content",
        "//javascript/angular2/testing/catalyst/async",
        "//third_party/javascript/angular2:platform_browser_animations",
        "//third_party/javascript/angular2:router",
        "//third_party/javascript/typings/jasmine",
    ],
)

js_test_environment(
    name = "desktop-light-en-chrome-linux",
    browser = "//testing/web/browsers:chrome-linux",
    css_renaming = "disabled",  # Angular doesn't support renaming.
    locale = "en-US",
    unmanaged_deps = ["//third_party/javascript/angular2:disable_zonejs"],
    viewport = (1280, 1024),
)

js_test_suite(
    name = "generate_content_test",
    environments = [":desktop-light-en-chrome-linux"],
    test_lib = ":generate_content_tests",
)

ng_module(
    name = "generate_content",
    srcs = ["generate_content.ts"],
    assets = [
        ":generate_content_css",
        "generate_content.ng.html",
    ],
    deps = [
        "//third_party/javascript/angular2:core",
        "//third_party/javascript/angular2:forms",
        "//third_party/javascript/google_genai",
    ],
)
