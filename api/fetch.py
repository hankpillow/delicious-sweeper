from google.appengine.ext import webapp
from google.appengine.ext.webapp import util
from google.appengine.api import urlfetch
from google.appengine.api.urlfetch_errors import *
from google.appengine.runtime import apiproxy_errors
from google.appengine.runtime import DeadlineExceededError

import traceback, logging, cgitb, cgi
import simplejson as json

class MainHandler(webapp.RequestHandler):

	def get(self):
		self.response.headers['Content-Type'] = 'application/json'
		self.response.out.write( json.dumps({"status_code":-1,"message":"post only dude!"}) )

	def post(self):

		self.response.headers['Content-Type'] = 'application/json'
		cgitb.enable()
		params = cgi.FieldStorage()

		url = params.getvalue("url")
		if (url == None):
			self.response.out.write( json.dumps({"status_code":-2,"message":"no url given"}) )
			return

		response = fetch_status(url)
		self.response.out.write( json.dumps(response) )

def fetch_status( url, headers=None ):
	response = {}
	try:
		result = urlfetch.fetch( url=url, deadline=30, allow_truncated=True)
		response = {"status_code":result.status_code,"url":url}
	except DownloadError, e:
		response = {"status_code":-3, "message":"%s" % e, "url":url}
	except InvalidURLError, e:
		response = {"status_code":-4, "message":"%s" % e, "url":url}
	except ResponseTooLargeError, e:
		response = {"status_code":-5, "message":"%s" % e, "url":url}
	except DeadlineExceededError, e:
		response = {"status_code":-6, "message":"%s" % e, "url":url}
	except Exception, e:
		response = {"status_code":-100, "message":"%s" % e, "url":url}
	return response

def main(has_debug=False):
    application = webapp.WSGIApplication([('/fetch', MainHandler)],debug=has_debug)
    util.run_wsgi_app(application)

if __name__ == '__main__':
    main(True)