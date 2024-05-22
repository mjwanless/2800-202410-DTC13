
window.onload = async () => {
    errorMessage = document.getElementById('loginErrorMsg')
    if (errorMessage) {
        await setTimeout(()=>{
            errorMessage.classList.add('fadeOut')
        }, 3000)
    }
    errorMessage.classList.remove('fadeOut')
}