fn main() -> Result<(), Box<dyn std::error::Error>> {
    vergen::EmitBuilder::builder()
        .build_timestamp()
        .git_sha(true)
        .git_branch()
        .git_commit_timestamp()
        .emit()?;
    Ok(())
}
