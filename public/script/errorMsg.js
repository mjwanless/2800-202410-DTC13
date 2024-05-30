
window.onload = async () => {
    errorMessage = document.getElementById('errorMsg')
    if (errorMessage) {
        await setTimeout(()=>{
            errorMessage.classList.add('fadeOut')
        }, 3000)
    }
    if (errorMessage !== null) {
        errorMessage.classList.remove('fadeOut')
    }
} 