
window.onload = async () => {
    errorMessage = document.getElementById('loginErrorMsg')
    if (errorMessage) {
        await setTimeout(()=>{
            errorMessage.classList.add('fadeOut')
        }, 3000)
    }
    if (errorMessage !== null) {
        errorMessage.classList.remove('fadeOut')
    }
}