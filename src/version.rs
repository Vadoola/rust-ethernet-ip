/// Current version of the library
pub const VERSION: &str = env!("CARGO_PKG_VERSION");

/// Major version number
pub const MAJOR_VERSION: u32 = 0;

/// Minor version number
pub const MINOR_VERSION: u32 = 1;

/// Patch version number
pub const PATCH_VERSION: u32 = 0;

/// Version string in format "v0.1.0"
pub const VERSION_STRING: &str = concat!("v", env!("CARGO_PKG_VERSION"));

/// Build date and time
pub const BUILD_DATE: &str = env!("VERGEN_BUILD_TIMESTAMP");

/// Git commit hash
pub const GIT_HASH: &str = env!("VERGEN_GIT_SHA");

/// Git commit date
pub const GIT_COMMIT_DATE: &str = env!("VERGEN_GIT_COMMIT_TIMESTAMP");

/// Git branch
pub const GIT_BRANCH: &str = env!("VERGEN_GIT_BRANCH"); 